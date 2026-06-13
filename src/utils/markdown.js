// A tiny, dependency-free markdown renderer covering the subset of syntax
// LifeOS's note editor toolbar produces: headers, bold, italic, bullet
// lists, and checkboxes.

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

export function renderMarkdown(text) {
  if (!text) return ''
  const lines = escapeHtml(text).split('\n')
  let html = ''
  let inList = false

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  for (const line of lines) {
    let m
    if ((m = line.match(/^- \[ \] (.*)$/))) {
      closeList()
      html += `<div class="flex items-center gap-2 my-0.5"><input type="checkbox" disabled class="rounded"/><span>${inline(m[1])}</span></div>`
    } else if ((m = line.match(/^- \[x\] (.*)$/i))) {
      closeList()
      html += `<div class="flex items-center gap-2 my-0.5"><input type="checkbox" checked disabled class="rounded"/><span class="line-through opacity-60">${inline(m[1])}</span></div>`
    } else if ((m = line.match(/^### (.*)$/))) {
      closeList()
      html += `<h3 class="font-display font-semibold text-base mt-2">${inline(m[1])}</h3>`
    } else if ((m = line.match(/^## (.*)$/))) {
      closeList()
      html += `<h2 class="font-display font-semibold text-lg mt-2">${inline(m[1])}</h2>`
    } else if ((m = line.match(/^# (.*)$/))) {
      closeList()
      html += `<h1 class="font-display font-semibold text-xl mt-2">${inline(m[1])}</h1>`
    } else if ((m = line.match(/^- (.*)$/))) {
      if (!inList) {
        html += '<ul class="list-disc pl-5">'
        inList = true
      }
      html += `<li>${inline(m[1])}</li>`
    } else if (line.trim() === '') {
      closeList()
      html += '<div class="h-2"></div>'
    } else {
      closeList()
      html += `<p>${inline(line)}</p>`
    }
  }
  closeList()
  return html
}

// Strips markdown syntax down to plain text for list previews.
export function markdownToPlainText(text, maxLen = 140) {
  if (!text) return ''
  const plain = text
    .replace(/^#{1,3}\s*/gm, '')
    .replace(/^- \[[ x]\]\s*/gim, '')
    .replace(/^-\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain
}
