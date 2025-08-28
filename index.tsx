import { GoogleGenAI } from "@google/genai";

// --- Type Definitions for Annotations ---
type Annotation = { type: 'line', x1: number, y1: number, x2: number, y2: number, color: string, strokeWidth: number }
               | { type: 'rect', x: number, y: number, width: number, height: number, color: string, fillOpacity: number }
               | { type: 'text', x: number, y: number, text: string, color: string, fontSize: number };
               
type BoundingBox = { x: number; y: number; width: number; height: number; };

// --- Constants ---
// Fixed bounding box for annotations, defining the plottable area on the chart image.
const FIXED_BOUNDING_BOX: BoundingBox = {
    x: 0.3,
    y: 4.0,
    width: 100 - 0.4 - 5.6, // 94.
    height: 100 - 4.0 - 10.0, // 86.0
};

// --- Helper Functions ---

// Helper function to convert a File object to a GoogleGenAI.Part object.
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string; }; }> => {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read file as string."));
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
    const base64EncodedData = await base64EncodedDataPromise;
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

/**
 * Parses a string of annotation instructions into an array of Annotation objects.
 */
const parseAnnotations = (text: string): Annotation[] => {
  if (!text) return [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const annotations: Annotation[] = [];

  for (const line of lines) {
    try {
        if (line.toUpperCase().startsWith("LINE:")) {
            const match = /x1=([\d.]+).*y1=([\d.]+).*x2=([\d.]+).*y2=([\d.]+).*color=([^,]+).*strokeWidth=([\d.]+)/i.exec(line);
            if (match) {
            annotations.push({
                type: "line",
                x1: +match[1], y1: +match[2], x2: +match[3], y2: +match[4],
                color: match[5].trim(), strokeWidth: +match[6] || 0.3,
            });
            }
        } else if (line.toUpperCase().startsWith("RECT:")) {
            const match = /x=([\d.]+).*y=([\d.]+).*width=([\d.]+).*height=([\d.]+).*color=([^,]+).*fillOpacity=([\d.]+)/i.exec(line);
            if (match) {
            annotations.push({
                type: "rect",
                x: +match[1], y: +match[2], width: +match[3], height: +match[4],
                color: match[5].trim(), fillOpacity: +match[6] || 0.2,
            });
            }
        } else if (line.toUpperCase().startsWith("TEXT:")) {
            const match = /x=([\d.]+).*y=([\d.]+).*text=\"([^\"]+)\".*color=([^,]+).*fontSize=([\d.]+)/i.exec(line);
            if (match) {
            annotations.push({
                type: "text",
                x: +match[1], y: +match[2],
                text: match[3], color: match[4].trim(), fontSize: +match[5] || 1.5,
            });
            }
        }
    } catch (e) {
        console.error("Failed to parse annotation line:", line, e);
    }
  }
  return annotations;
};

/**
 * Renders annotation objects into an SVG element.
 */
const renderAnnotationsToSVG = (svgElement: SVGSVGElement, annotations: Annotation[], boundingBox: BoundingBox) => {
    svgElement.innerHTML = ''; // Clear previous annotations
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${boundingBox.x} ${boundingBox.y}) scale(${boundingBox.width / 100} ${boundingBox.height / 100})`);

    annotations.forEach(anno => {
        let el;
        if (anno.type === 'line') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            el.setAttribute('x1', String(anno.x1));
            el.setAttribute('y1', String(anno.y1));
            el.setAttribute('x2', String(anno.x2));
            el.setAttribute('y2', String(anno.y2));
            el.setAttribute('stroke', anno.color || '#ffffff');
            el.setAttribute('stroke-width', String(anno.strokeWidth));
        } else if (anno.type === 'rect') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            el.setAttribute('x', String(anno.x));
            el.setAttribute('y', String(anno.y));
            el.setAttribute('width', String(anno.width));
            el.setAttribute('height', String(anno.height));
            el.setAttribute('fill', anno.color || '#ffffff');
            el.setAttribute('fill-opacity', String(anno.fillOpacity));
        } else if (anno.type === 'text') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            el.setAttribute('x', String(anno.x));
            el.setAttribute('y', String(anno.y));
            el.setAttribute('fill', anno.color || '#ffffff');
            el.setAttribute('font-size', String(anno.fontSize));
            el.textContent = anno.text;
        }
        if (el) {
            group.appendChild(el);
        }
    });

    svgElement.appendChild(group);
};


document.addEventListener('DOMContentLoaded', () => {
    // --- Analysis Panel Logic ---
    const analysisForm = document.getElementById('analysis-form') as HTMLFormElement | null;
    const fileInput = document.getElementById('chart-upload') as HTMLInputElement | null;
    const uploadButton = document.getElementById('upload-button') as HTMLButtonElement | null;
    const fileNameDisplay = document.getElementById('file-name-display') as HTMLSpanElement | null;
    const userQueryInput = document.getElementById('user-query-input') as HTMLTextAreaElement | null;
    const analyzeButton = document.getElementById('analyze-button') as HTMLButtonElement | null;
    const analysisHistory = document.getElementById('analysis-history') as HTMLDivElement | null;
    const placeholder = document.querySelector('.placeholder') as HTMLDivElement | null;

    let selectedFile: File | null = null;

    if (analysisForm && fileInput && uploadButton && fileNameDisplay && userQueryInput && analyzeButton && analysisHistory) {
        
        const updateButtonState = () => {
            // Enable button if there is text in the query input.
            if (userQueryInput?.value.trim()) {
                analyzeButton.disabled = false;
            } else {
                analyzeButton.disabled = true;
            }
        };
        
        const handleFileSelect = (file: File | null) => {
             if (file && file.type.startsWith('image/')) {
                selectedFile = file;
                fileNameDisplay.textContent = file.name;
                uploadButton.classList.add('file-selected');
             } else {
                selectedFile = null;
                fileNameDisplay.textContent = '';
                uploadButton.classList.remove('file-selected');
                if (file) { // if a file was provided but not an image
                    alert('Please select an image file (e.g., PNG, JPG).');
                }
             }
             updateButtonState();
        };

        uploadButton.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', () => {
            const file = fileInput.files ? fileInput.files[0] : null;
            handleFileSelect(file);
        });

        userQueryInput.addEventListener('input', () => {
            updateButtonState();
            // Auto-resize textarea
            userQueryInput.style.height = 'auto';
            userQueryInput.style.height = `${userQueryInput.scrollHeight}px`;
        });
        
        // Drag and Drop
        analysisHistory.addEventListener('dragover', (e) => {
            e.preventDefault();
            analysisHistory.classList.add('drag-over');
        });

        analysisHistory.addEventListener('dragleave', (e) => {
            e.preventDefault();
            analysisHistory.classList.remove('drag-over');
        });

        analysisHistory.addEventListener('drop', (e) => {
            e.preventDefault();
            analysisHistory.classList.remove('drag-over');
            const file = e.dataTransfer?.files ? e.dataTransfer.files[0] : null;
            if(file) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect(file);
            }
        });
        
        analysisForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userQuery = userQueryInput.value.trim();
            if (!userQuery) {
                alert('Please enter a query.');
                return;
            }

            // Hide placeholder if it's visible
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            const fileForAnalysis = selectedFile;
            
            // --- Create and append the new analysis entry ---
            const entryElement = document.createElement('div');
            entryElement.className = 'analysis-entry';
            
            const queryTextElement = document.createElement('p');
            queryTextElement.className = 'user-query-text';
            queryTextElement.textContent = fileForAnalysis
                ? `Your query for "${fileForAnalysis.name}": "${userQuery}"`
                : `Your question: "${userQuery}"`;
            
            const loader = document.createElement('div');
            loader.className = 'loader';
            
            entryElement.appendChild(queryTextElement);

            // This will be populated only if there's a file
            let svgOverlay: SVGSVGElement | null = null; 

            if (fileForAnalysis) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
    
                const imagePreview = document.createElement('img');
                imagePreview.src = URL.createObjectURL(fileForAnalysis);
                imagePreview.alt = "Uploaded chart screenshot for analysis";
    
                svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgOverlay.setAttribute('class', 'annotation-overlay');
                svgOverlay.setAttribute('viewBox', '0 0 100 100');
                svgOverlay.setAttribute('preserveAspectRatio', 'none');
                
                imageContainer.appendChild(imagePreview);
                imageContainer.appendChild(svgOverlay);
                entryElement.appendChild(imageContainer);
            }

            entryElement.appendChild(loader);
            analysisHistory.appendChild(entryElement);
            analysisHistory.scrollTop = analysisHistory.scrollHeight;

            // Reset form
            handleFileSelect(null);
            fileInput.value = '';
            userQueryInput.value = '';
            userQueryInput.style.height = 'auto'; // Reset textarea height
            updateButtonState();
            
            try {
                // 1. Fetch reference knowledge
                const referenceResponse = await fetch('http://45.130.165.161:8080/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });

                const data = await referenceResponse.json();
                const referenceData = data.reference;
    
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                if (fileForAnalysis) {
                    // --- IMAGE ANALYSIS PATH ---
                    const imagePart = await fileToGenerativePart(fileForAnalysis);
        
                    const prompt = `You are an expert financial market analyst specializing in Wyckoff methodology.

**Reference Knowledge:**
You have access to the following reference knowledge extracted from a book on market structure and Wyckoff methodology:
---
${referenceData}
---

**User's Context:**
The user has provided the following query or context for the analysis:
"${userQuery}"

**Analysis Task & Output Format:**
Your analysis MUST be based on the principles from the provided reference knowledge. Your response MUST follow this exact structure:

1.  **Narrative Analysis:** Provide a detailed, structured narrative explaining the market's story according to Wyckoff principles found in the reference knowledge. Identify accumulation, distribution, or other patterns. Explain your reasoning step by step, applying the rules from the book. Highlight key events, levels, or points (e.g., SC, AR, BC, ST, UT, SOS, SOW). Do not assume information that is not in the reference.

2.  **Key Points Summary:** A mandatory section starting with the exact header "**Key Points:**". This must contain a bulleted list summarizing every critical event, price level, and date you identified in your narrative. This is the primary summary for generating visual annotations.
    **Example for "Key Points:":**
    - Selling Climax (SC) at price 1850.50 on Jan 10
    - Automatic Rally (AR) resistance at price 1880.00 on Jan 11
    - Secondary Test (ST) at price 1855.25 on Jan 12

3.  **Annotation Instructions Separator:** You MUST include a separator line exactly as follows:
--- ANNOTATIONS ---

4.  **Annotation Instructions:** Following the separator, provide a list of visual annotation instructions based on your "Key Points" summary.

**CRITICAL ANNOTATION INSTRUCTIONS:**

1.  **Fixed Plotting Area:** The main plotting area (where price action occurs) is a fixed region. Your coordinates MUST be placed within this area. The plotting area is defined by excluding the following from the image dimensions:
    *   Top: 4% is excluded.
    *   Bottom: 20% is excluded.
    *   Left: 5.6% is excluded.
    *   Right: 0.5% is excluded.

2.  **Coordinate System:** Coordinates are percentages relative to this fixed plotting area.
    *   X-Coordinate (Time): Left edge is x=0, right edge is x=100.
    *   Y-Coordinate (Price): **Top** edge is y=0, **bottom** edge is y=100.

3.  **Formats:** Output ONLY a list of annotation instructions in the specified formats.
    - LINE: x1=10.5, y1=20.0, x2=50.2, y2=20.8, color=#FF0000, strokeWidth=0.3
    - RECT: x=10.0, y=15.5, width=40.0, height=20.0, color=#00FF00, fillOpacity=0.2
    - TEXT: x=15.0, y=18.5, text="Label", color=#FFD600, fontSize=1.5

4.  **Clarity:** Keep text labels concise (e.g., "BC", "AR", "SOS"). Do not include price values in the text labels. Place labels slightly above or below points for clarity.

Begin your full analysis now.`;
        
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { parts: [imagePart, { text: prompt }] },
                    });
                    
                    const fullResponseText = response.text;
                    const separator = '--- ANNOTATIONS ---';
                    const separatorIndex = fullResponseText.indexOf(separator);

                    let analysisText = fullResponseText;
                    let annotationText = '';

                    if (separatorIndex !== -1) {
                        analysisText = fullResponseText.substring(0, separatorIndex).trim();
                        annotationText = fullResponseText.substring(separatorIndex + separator.length).trim();
                    } else {
                        console.warn("Annotation separator not found in the response.");
                    }

                    const analysisTextElement = document.createElement('div');
                    analysisTextElement.className = 'analysis-text';
                    analysisTextElement.innerHTML = analysisText.replace(/\n/g, '<br>');
                    
                    if (svgOverlay) {
                        const annotations = parseAnnotations(annotationText);
                        renderAnnotationsToSVG(svgOverlay, annotations, FIXED_BOUNDING_BOX);
                    }

                    entryElement.replaceChild(analysisTextElement, loader);
                } else {
                    // --- TEXT-ONLY KNOWLEDGE QUERY PATH ---
                    const prompt = `You are an expert financial market analyst specializing in Wyckoff methodology.

**Reference Knowledge:**
You have access to the following reference knowledge extracted from a book on market structure and Wyckoff methodology:
---
${referenceData}
---

**User's Question:**
"${userQuery}"

**Task:**
Based *only* on the provided reference knowledge, please answer the user's question. Provide a clear, structured, and helpful explanation. Do not use any external knowledge or make assumptions beyond the text provided.`;

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { parts: [{ text: prompt }] },
                    });

                    const analysisText = response.text;
                    const analysisTextElement = document.createElement('div');
                    analysisTextElement.className = 'analysis-text';
                    analysisTextElement.innerHTML = analysisText.replace(/\n/g, '<br>');

                    entryElement.replaceChild(analysisTextElement, loader);
                }
    
            } catch (error) {
                console.error('Analysis error:', error);
                const errorElement = document.createElement('div');
                errorElement.className = 'analysis-text'; // Use same class for consistent styling
                errorElement.innerHTML = `<p class="error-message">Failed to get analysis. Please check the console for more details.</p>`;
                if (error instanceof Error) {
                    errorElement.innerHTML += `<p class="error-details">${error.message}</p>`;
                }
                entryElement.replaceChild(errorElement, loader);
            } finally {
                analysisHistory.scrollTop = analysisHistory.scrollHeight;
            }
        });
    } else {
        console.warn('One or more analysis panel elements are not found in the DOM.');
    }
});