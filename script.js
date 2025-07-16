document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const navbar = document.getElementById("navbar")
  const navLinks = document.querySelector(".nav-links")
  const hamburger = document.querySelector(".hamburger")
  const sections = document.querySelectorAll(".section")
  const timerDisplay = document.getElementById("timer-display")
  const timerProgress = document.getElementById("timer-progress")
  const timerCircle = document.querySelector(".timer-circle")
  const taskNameInput = document.getElementById("task-name")
  const projectSelect = document.getElementById("project")
  const customProjectContainer = document.getElementById("custom-project-container")
  const customProjectInput = document.getElementById("custom-project")
  const tagNameInput = document.getElementById("tag-name")
  const tagColorInput = document.getElementById("tag-color")
  const colorPreview = document.querySelector(".color-preview")
  const addTagBtn = document.getElementById("add-tag")
  const tagsContainer = document.getElementById("tags-container")
  const startBtn = document.getElementById("start-btn")
  const pauseBtn = document.getElementById("pause-btn")
  const stopBtn = document.getElementById("stop-btn")
  const manualEntryBtn = document.getElementById("manual-entry-btn")
  const manualEntryModal = document.getElementById("manual-entry-modal")
  const closeModalBtn = document.querySelector(".close-modal")
  const cancelManualEntryBtn = document.querySelector(".cancel-manual-entry")
  const manualEntryForm = document.getElementById("manual-entry-form")
  const logsTableBody = document.getElementById("logs-table-body")
  const logsCardsContainer = document.getElementById("logs-cards")
  const logsSummary = document.getElementById("logs-summary")
  const timeFilter = document.getElementById("time-filter")
  const projectFilter = document.getElementById("project-filter")
  const projectStatsContainer = document.getElementById("project-stats")
  const pieChartCanvas = document.getElementById("pie-chart")
  const noDataMessagePie = document.getElementById("no-data-message-pie") // Renamed ID
  const darkModeToggle = document.getElementById("dark-mode-toggle")
  const durationDisplay = document.getElementById("calculated-duration")
  const confirmationModal = document.getElementById("confirmation-modal")
  const confirmationTitle = document.getElementById("confirmation-title")
  const confirmationMessage = document.getElementById("confirmation-message")
  const confirmYesBtn = document.getElementById("confirm-yes")
  const confirmNoBtn = document.getElementById("confirm-no")
  const modalTitle = document.getElementById("modal-title")
  const downloadPdfBtn = document.getElementById("download-pdf")
  const customDateInput = document.getElementById("custom-date-input") // New DOM element

  // App State
  let timer = null
  let seconds = 0
  let isRunning = false
  let isPaused = false
  let currentTask = null
  const tasks = JSON.parse(localStorage.getItem("clokd_tasks")) || []
  let tags = []
  let manualTags = []
  let isEditMode = false
  let editIndex = -1
  let confirmationCallback = null
  let continueTaskIndex = -1

  // Initialize the app
  init()

  function init() {
    setupEventListeners()
    highlightActiveSection()
    renderLogs()
    updateReports() // Initial report update
    updateProjectFilter()
    initializeDarkMode()
    updateColorPreview()
    updateManualColorPreview()
    // Ensure custom date input visibility is correct on load if "custom" was saved
    handleTimeFilterChange()
  }

  function setupEventListeners() {
    // Dark mode toggle
    darkModeToggle.addEventListener("click", toggleDarkMode)

    // Navbar hamburger menu
    hamburger.addEventListener("click", toggleNav)

    // Smooth scrolling for nav links
    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault()
        const targetId = this.getAttribute("href")
        document.querySelector(targetId).scrollIntoView({
          behavior: "smooth",
        })

        if (navLinks.classList.contains("active")) {
          toggleNav()
        }
      })
    })

    // Project select change
    projectSelect.addEventListener("change", function () {
      if (this.value === "Other") {
        customProjectContainer.classList.remove("hidden")
        customProjectInput.focus()
      } else {
        customProjectContainer.classList.add("hidden")
      }
    })

    // Manual project select change
    document.getElementById("manual-project").addEventListener("change", function () {
      const container = document.getElementById("manual-custom-project-container")
      if (this.value === "Other") {
        container.classList.remove("hidden")
        document.getElementById("manual-custom-project").focus()
      } else {
        container.classList.add("hidden")
      }
    })

    // Color picker changes
    tagColorInput.addEventListener("input", updateColorPreview)
    document.getElementById("manual-tag-color").addEventListener("input", updateManualColorPreview)

    // Tag input validation
    tagNameInput.addEventListener("input", validateTagInput)
    document.getElementById("manual-tag-name").addEventListener("input", validateManualTagInput)

    // Add tag buttons
    addTagBtn.addEventListener("click", addTag)
    document.getElementById("manual-add-tag").addEventListener("click", addManualTag)

    // Timer control buttons
    startBtn.addEventListener("click", startTimer)
    pauseBtn.addEventListener("click", pauseTimer)
    stopBtn.addEventListener("click", stopTimer)

    // Manual entry
    manualEntryBtn.addEventListener("click", openManualEntryModal)
    closeModalBtn.addEventListener("click", closeManualEntryModal)
    cancelManualEntryBtn.addEventListener("click", closeManualEntryModal)
    manualEntryForm.addEventListener("submit", saveManualEntry)

    // Manual entry time calculation
    document.getElementById("manual-start-time").addEventListener("change", calculateDuration)
    document.getElementById("manual-end-time").addEventListener("change", calculateDuration)

    // Window scroll for active section highlighting
    window.addEventListener("scroll", highlightActiveSection)

    // Filter changes for reports
    timeFilter.addEventListener("change", handleTimeFilterChange) // Use new handler
    projectFilter.addEventListener("change", updateReports)
    customDateInput.addEventListener("change", updateReports) // New: call updateReports when custom date changes

    // Click outside modal to close
    window.addEventListener("click", (e) => {
      if (e.target === manualEntryModal) {
        closeManualEntryModal()
      }
    })

    // Task name validation
    taskNameInput.addEventListener("input", () => {
      clearError("task-name-error")
    })

    // PDF download
    downloadPdfBtn.addEventListener("click", downloadPDF)

    // Confirmation modal
    confirmYesBtn.addEventListener("click", handleConfirmYes)
    confirmNoBtn.addEventListener("click", closeConfirmationModal)

    // Click outside confirmation modal to close
    window.addEventListener("click", (e) => {
      if (e.target === confirmationModal) {
        closeConfirmationModal()
      }
    })
  }

  // Dark Mode Functions
  function initializeDarkMode() {
    const savedTheme = localStorage.getItem("clokd_theme") || "light"
    document.body.setAttribute("data-theme", savedTheme)
  }

  function toggleDarkMode() {
    const currentTheme = document.body.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"

    document.body.setAttribute("data-theme", newTheme)
    localStorage.setItem("clokd_theme", newTheme)
  }

  // Navigation Functions
  function toggleNav() {
    navLinks.classList.toggle("active")
    document.body.classList.toggle("menu-open", navLinks.classList.contains("active"))
  }

  function highlightActiveSection() {
    let currentSection = ""

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100
      const sectionHeight = section.offsetHeight

      if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
        currentSection = section.getAttribute("id")
      }
    })

    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === `#${currentSection}`) {
        link.classList.add("active")
      }
    })
  }

  // Timer Functions
  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":")
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(seconds)
    updateTimerProgress()
  }

  function updateTimerProgress() {
    // Update circular progress (max 1 hour = 3600 seconds for full circle)
    const maxSeconds = 3600 // 1 hour
    const progress = Math.min(seconds / maxSeconds, 1)
    const circumference = 2 * Math.PI * 90 // radius = 90
    const offset = circumference - progress * circumference

    timerProgress.style.strokeDashoffset = offset

    // Add running animation
    if (isRunning && !isPaused) {
      timerCircle.classList.add("running")
    } else {
      timerCircle.classList.remove("running")
    }
  }

  function startTimer() {
    const taskName = taskNameInput.value.trim()

    if (!taskName) {
      showError("task-name-error", "Please enter a task name")
      taskNameInput.focus()
      return
    }

    clearError("task-name-error")

    if (!isRunning) {
      // Start a new timer
      isRunning = true
      isPaused = false
      seconds = 0

      currentTask = {
        taskName,
        project: projectSelect.value === "Other" ? customProjectInput.value.trim() || "Other" : projectSelect.value,
        tags: [...tags],
        startTime: new Date(),
        endTime: null,
        duration: 0,
      }

      timer = setInterval(() => {
        seconds++
        updateTimerDisplay()
      }, 1000)

      updateButtonStates(true, false)
      disableInputs(true)
    } else if (isPaused) {
      // Resume paused timer
      isPaused = false
      timer = setInterval(() => {
        seconds++
        updateTimerDisplay()
      }, 1000)

      pauseBtn.querySelector(".button-text").textContent = "Pause"
      pauseBtn.querySelector(".button-icon").textContent = "⏸"
    }

    updateTimerDisplay()
  }

  function pauseTimer() {
    if (isRunning && !isPaused) {
      clearInterval(timer)
      isPaused = true
      pauseBtn.querySelector(".button-text").textContent = "Resume"
      pauseBtn.querySelector(".button-icon").textContent = "▶"
      timerCircle.classList.remove("running")
    } else if (isPaused) {
      startTimer()
    }
  }

  function stopTimer() {
    clearInterval(timer)
    isRunning = false
    isPaused = false

    if (currentTask) {
      currentTask.endTime = new Date()
      currentTask.duration = seconds

      if (continueTaskIndex >= 0) {
        // Update existing task instead of creating new one
        const originalTask = tasks[continueTaskIndex]
        tasks[continueTaskIndex] = {
          ...currentTask,
          startTime: originalTask.startTime, // Keep original start time
          duration: originalTask.duration + seconds, // Add to existing duration
        }
        continueTaskIndex = -1
      } else {
        // Create new task
        tasks.push(currentTask)
      }

      saveTasks()
    }

    resetTimerUI()
    renderLogs()
    updateReports()
    updateProjectFilter()
  }

  function resetTimerUI() {
    seconds = 0
    updateTimerDisplay()
    tags = []
    tagsContainer.innerHTML = ""

    updateButtonStates(false, true)
    disableInputs(false)

    // Reset form
    taskNameInput.value = ""
    projectSelect.value = "Work"
    customProjectContainer.classList.add("hidden")
    customProjectInput.value = ""
    tagNameInput.value = ""

    // Reset pause button text
    pauseBtn.querySelector(".button-text").textContent = "Pause"
    pauseBtn.querySelector(".button-icon").textContent = "⏸"
  }

  function updateButtonStates(running, stopped) {
    startBtn.disabled = running
    pauseBtn.disabled = stopped
    stopBtn.disabled = stopped
  }

  function disableInputs(disabled) {
    taskNameInput.disabled = disabled
    projectSelect.disabled = disabled
    customProjectInput.disabled = disabled
    tagNameInput.disabled = disabled
    addTagBtn.disabled = disabled
  }

  // Tag Functions
  function updateColorPreview() {
    colorPreview.style.backgroundColor = tagColorInput.value
  }

  function updateManualColorPreview() {
    const preview = document.querySelector("#manual-tags-container").parentElement.querySelector(".color-preview")
    if (preview) {
      preview.style.backgroundColor = document.getElementById("manual-tag-color").value
    }
  }

  function validateTagInput() {
    const value = tagNameInput.value
    const invalidChars = /[,;]/

    if (invalidChars.test(value)) {
      showError("tag-error", "Tags cannot contain commas or semicolons")
      return false
    }

    clearError("tag-error")
    return true
  }

  function validateManualTagInput() {
    const value = document.getElementById("manual-tag-name").value
    const invalidChars = /[,;]/

    if (invalidChars.test(value)) {
      showError("manual-tag-error", "Tags cannot contain commas or semicolons")
      return false
    }

    clearError("manual-tag-error")
    return true
  }

  function addTag() {
    const tagName = tagNameInput.value.trim()

    if (!tagName) {
      showError("tag-error", "Please enter a tag name")
      tagNameInput.focus()
      return
    }

    if (!validateTagInput()) {
      return
    }

    // Check for duplicate tags
    if (tags.some((tag) => tag.name.toLowerCase() === tagName.toLowerCase())) {
      showError("tag-error", "Tag already exists")
      return
    }

    clearError("tag-error")

    const tagColor = tagColorInput.value

    tags.push({
      name: tagName,
      color: tagColor,
    })

    renderTag(tagName, tagColor, tagsContainer, () => {
      tags = tags.filter((tag) => !(tag.name === tagName && tag.color === tagColor))
    })

    tagNameInput.value = ""
    tagNameInput.focus()
  }

  function addManualTag() {
    const tagName = document.getElementById("manual-tag-name").value.trim()
    const tagColor = document.getElementById("manual-tag-color").value
    const container = document.getElementById("manual-tags-container")

    if (!tagName) {
      showError("manual-tag-error", "Please enter a tag name")
      document.getElementById("manual-tag-name").focus()
      return
    }

    if (!validateManualTagInput()) {
      return
    }

    // Check for duplicate tags
    if (manualTags.some((tag) => tag.name.toLowerCase() === tagName.toLowerCase())) {
      showError("manual-tag-error", "Tag already exists")
      return
    }

    clearError("manual-tag-error")

    manualTags.push({
      name: tagName,
      color: tagColor,
    })

    renderTag(tagName, tagColor, container, () => {
      manualTags = manualTags.filter((tag) => !(tag.name === tagName && tag.color === tagColor))
    })

    document.getElementById("manual-tag-name").value = ""
    document.getElementById("manual-tag-name").focus()
  }

  function renderTag(name, color, container, onDelete) {
    const tagElement = document.createElement("div")
    tagElement.className = "tag"
    tagElement.innerHTML = `
            <span class="tag-color" style="background-color: ${color}"></span>
            ${name}
            <span class="delete-tag">×</span>
        `

    const deleteBtn = tagElement.querySelector(".delete-tag")
    deleteBtn.addEventListener("click", () => {
      tagElement.remove()
      if (onDelete) onDelete()
    })

    container.appendChild(tagElement)
  }

  // Modal Functions
  function openManualEntryModal() {
    // Update modal title based on mode
    if (isEditMode) {
      modalTitle.textContent = "Editing Time Log Entry"
    } else {
      modalTitle.textContent = "Manual Time Entry"
    }

    manualEntryModal.classList.add("active")
    document.getElementById("manual-task-name").focus()

    // Set default times only if not editing
    if (!isEditMode) {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      document.getElementById("manual-start-time").value = formatDateTimeForInput(oneHourAgo)
      document.getElementById("manual-end-time").value = formatDateTimeForInput(now)
    }

    calculateDuration()
  }

  function closeManualEntryModal() {
    manualEntryModal.classList.remove("active")
    manualEntryForm.reset()
    manualTags = []
    document.getElementById("manual-tags-container").innerHTML = ""
    document.getElementById("manual-custom-project-container").classList.add("hidden")

    // Clear errors
    clearAllErrors()

    // Reset edit mode
    isEditMode = false
    editIndex = -1

    // Reset form submit handler
    manualEntryForm.onsubmit = saveManualEntry
  }

  function calculateDuration() {
    const startTime = document.getElementById("manual-start-time").value
    const endTime = document.getElementById("manual-end-time").value

    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      const diffSeconds = Math.floor((end - start) / 1000)

      if (diffSeconds > 0) {
        durationDisplay.textContent = formatTime(diffSeconds)
        clearError("manual-start-error")
        clearError("manual-end-error")
      } else {
        durationDisplay.textContent = "00:00:00"
        if (diffSeconds < 0) {
          showError("manual-end-error", "End time must be after start time")
        }
      }
    }
  }

  function saveManualEntry(e) {
    e.preventDefault()

    const taskName = document.getElementById("manual-task-name").value.trim()
    const projectSelect = document.getElementById("manual-project")
    const project =
      projectSelect.value === "Other"
        ? document.getElementById("manual-custom-project").value.trim() || "Other"
        : projectSelect.value
    const startTime = document.getElementById("manual-start-time").value
    const endTime = document.getElementById("manual-end-time").value

    // Validate inputs
    let hasErrors = false

    if (!taskName) {
      showError("manual-task-error", "Please enter a task name")
      hasErrors = true
    }

    if (!startTime) {
      showError("manual-start-error", "Please select start time")
      hasErrors = true
    }

    if (!endTime) {
      showError("manual-end-error", "Please select end time")
      hasErrors = true
    }

    if (startTime && endTime) {
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)

      if (endDate <= startDate) {
        showError("manual-end-error", "End time must be after start time")
        hasErrors = true
      }
    }

    if (hasErrors) {
      return
    }

    const startDate = new Date(startTime)
    const endDate = new Date(endTime)
    const duration = Math.floor((endDate - startDate) / 1000)

    const task = {
      taskName,
      project,
      tags: [...manualTags],
      startTime: startDate,
      endTime: endDate,
      duration,
    }

    if (isEditMode) {
      tasks[editIndex] = task
    } else {
      tasks.push(task)
    }

    saveTasks()
    closeManualEntryModal()
    renderLogs()
    updateReports()
    updateProjectFilter()
  }

  // Logs Functions
  function renderLogs() {
    // Clear existing logs
    logsTableBody.innerHTML = ""
    logsCardsContainer.innerHTML = ""

    if (tasks.length === 0) {
      logsTableBody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--dark-gray);">No time entries yet. Start tracking to see your logs here.</td></tr>'
      logsCardsContainer.innerHTML =
        '<div class="log-card" style="text-align: center;">No time entries yet. Start tracking to see your logs here.</div>'
      updateLogsSummary(0, 0)
      return
    }

    // Sort tasks by start time (newest first)
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

    // Calculate totals
    const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0)
    updateLogsSummary(tasks.length, totalDuration)

    // Render desktop table view
    sortedTasks.forEach((task, index) => {
      const originalIndex = tasks.findIndex((t) => t === task)
      const row = document.createElement("tr")

      const startTimeStr = formatDateTime(new Date(task.startTime))
      const endTimeStr = formatDateTime(new Date(task.endTime))
      const durationStr = formatTime(task.duration)

      const tagsHtml = task.tags
        .map(
          (tag) => `
                <span class="tag">
                    <span class="tag-color" style="background-color: ${tag.color}"></span>
                    ${tag.name}
                </span>
            `,
        )
        .join("")

      row.innerHTML = `
                <td><strong>${task.taskName}</strong></td>
                <td><span style="color: var(--medium-blue); font-weight: 500;">${task.project}</span></td>
                <td>${tagsHtml || '<span style="color: var(--light-gray); font-style: italic;">No tags</span>'}</td>
                <td>${startTimeStr}</td>
                <td>${endTimeStr}</td>
                <td><strong>${durationStr}</strong></td>
                <td class="log-actions">
                    <button class="edit-log small-button secondary-button" data-index="${originalIndex}">Edit</button>
                    <button class="delete-log small-button" data-index="${originalIndex}" style="background-color: var(--error); color: white; border: none;">Delete</button>
                    <button class="continue-log small-button tertiary-button" data-index="${originalIndex}">Continue</button>
                </td>
            `

      logsTableBody.appendChild(row)

      // Render mobile card view
      const card = document.createElement("div")
      card.className = "log-card"
      card.innerHTML = `
                <p><strong>Task:</strong> ${task.taskName}</p>
                <p><strong>Project:</strong> <span style="color: var(--medium-blue); font-weight: 500;">${task.project}</span></p>
                <div class="log-tags">${tagsHtml || '<span style="color: var(--light-gray); font-style: italic;">No tags</span>'}</div>
                <p><strong>Start:</strong> ${startTimeStr}</p>
                <p><strong>End:</strong> ${endTimeStr}</p>
                <p><strong>Duration:</strong> <strong>${durationStr}</strong></p>
                <div class="log-actions">
                    <button class="edit-log small-button secondary-button" data-index="${originalIndex}">Edit</button>
                    <button class="delete-log small-button" data-index="${originalIndex}" style="background-color: var(--error); color: white; border: none;">Delete</button>
                    <button class="continue-log small-button tertiary-button" data-index="${originalIndex}">Continue</button>
                </div>
            `

      logsCardsContainer.appendChild(card)
    })

    // Add event listeners to action buttons
    document.querySelectorAll(".edit-log").forEach((btn) => {
      btn.addEventListener("click", function () {
        editLog(Number.parseInt(this.getAttribute("data-index")))
      })
    })

    document.querySelectorAll(".delete-log").forEach((btn) => {
      btn.addEventListener("click", function () {
        deleteLog(Number.parseInt(this.getAttribute("data-index")))
      })
    })

    document.querySelectorAll(".continue-log").forEach((btn) => {
      btn.addEventListener("click", function () {
        continueLog(Number.parseInt(this.getAttribute("data-index")))
      })
    })
  }

  function updateLogsSummary(count, totalDuration) {
    const entriesText = count === 1 ? "1 entry" : `${count} entries`
    const totalTimeText = `Total: ${formatTime(totalDuration)}`

    logsSummary.innerHTML = `
            <span class="total-entries">${entriesText}</span>
            <span class="total-time">${totalTimeText}</span>
        `
  }

  function formatDateTime(date) {
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatDateTimeForInput(date) {
    return date.toISOString().slice(0, 16)
  }

  function editLog(index) {
    const task = tasks[index]
    isEditMode = true
    editIndex = index

    // Open modal
    openManualEntryModal()

    // Fill form with task data
    document.getElementById("manual-task-name").value = task.taskName

    const projectSelect = document.getElementById("manual-project")
    const isStandardProject = ["Work", "Study", "Personal", "Break"].includes(task.project)

    if (isStandardProject) {
      projectSelect.value = task.project
      document.getElementById("manual-custom-project-container").classList.add("hidden")
    } else {
      projectSelect.value = "Other"
      document.getElementById("manual-custom-project-container").classList.remove("hidden")
      document.getElementById("manual-custom-project").value = task.project
    }

    document.getElementById("manual-start-time").value = formatDateTimeForInput(new Date(task.startTime))
    document.getElementById("manual-end-time").value = formatDateTimeForInput(new Date(task.endTime))

    // Add tags
    manualTags = [...task.tags]
    const tagsContainer = document.getElementById("manual-tags-container")
    tagsContainer.innerHTML = ""

    task.tags.forEach((tag) => {
      renderTag(tag.name, tag.color, tagsContainer, () => {
        manualTags = manualTags.filter((t) => !(t.name === tag.name && t.color === tag.color))
      })
    })

    calculateDuration()
  }

  function showConfirmation(title, message, callback) {
    confirmationTitle.textContent = title
    confirmationMessage.textContent = message
    confirmationCallback = callback
    confirmationModal.classList.add("active")
  }

  function closeConfirmationModal() {
    confirmationModal.classList.remove("active")
    confirmationCallback = null
  }

  function handleConfirmYes() {
    if (confirmationCallback) {
      confirmationCallback()
    }
    closeConfirmationModal()
  }

  function deleteLog(index) {
    showConfirmation(
      "Delete Time Entry",
      "Are you sure you want to delete this time entry? This action cannot be undone.",
      () => {
        tasks.splice(index, 1)
        saveTasks()
        renderLogs()
        updateReports()
        updateProjectFilter()
      },
    )
  }

  function continueLog(index) {
    const task = tasks[index]
    continueTaskIndex = index

    // Stop current timer if running
    if (isRunning) {
      stopTimer()
    }

    // Set up the timer with this task's details
    taskNameInput.value = task.taskName

    const isStandardProject = ["Work", "Study", "Personal", "Break"].includes(task.project)
    if (isStandardProject) {
      projectSelect.value = task.project
      customProjectContainer.classList.add("hidden")
    } else {
      projectSelect.value = "Other"
      customProjectContainer.classList.remove("hidden")
      customProjectInput.value = task.project
    }

    // Add tags
    tagsContainer.innerHTML = ""
    tags = [...task.tags]
    task.tags.forEach((tag) => {
      renderTag(tag.name, tag.color, tagsContainer, () => {
        tags = tags.filter((t) => !(t.name === tag.name && t.color === tag.color))
      })
    })

    // Set initial seconds to the task's duration
    seconds = task.duration
    updateTimerDisplay()

    // Scroll to timer section
    document.getElementById("tracker").scrollIntoView({
      behavior: "smooth",
    })
  }

  // Reports Functions
  function handleTimeFilterChange() {
    if (timeFilter.value === "custom") {
      customDateInput.classList.remove("hidden")
      // Set default to today if no custom date was previously selected
      if (!customDateInput.value) {
        const today = new Date()
        customDateInput.value = today.toISOString().split("T")[0] // YYYY-MM-DD format
      }
    } else {
      customDateInput.classList.add("hidden")
    }
    updateReports() // Always update reports when filter changes
  }

  function updateReports() {
    const timeFilterValue = timeFilter.value
    const projectFilterValue = projectFilter.value

    let filteredTasks = [...tasks]

    // Apply time filter
    const now = new Date()

    if (timeFilterValue === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      filteredTasks = filteredTasks.filter((task) => new Date(task.endTime) >= todayStart)
    } else if (timeFilterValue === "week") {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const weekStart = new Date(now.setDate(diff))
      weekStart.setHours(0, 0, 0, 0)

      filteredTasks = filteredTasks.filter((task) => new Date(task.endTime) >= weekStart)
    } else if (timeFilterValue === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      filteredTasks = filteredTasks.filter((task) => new Date(task.endTime) >= monthStart)
    } else if (timeFilterValue === "custom") {
      // New custom filter logic
      const selectedDateString = customDateInput.value
      if (selectedDateString) {
        const selectedDate = new Date(selectedDateString)
        selectedDate.setHours(0, 0, 0, 0) // Start of the selected day
        const nextDay = new Date(selectedDate)
        nextDay.setDate(selectedDate.getDate() + 1) // Start of the next day

        filteredTasks = filteredTasks.filter(
          (task) => new Date(task.endTime) >= selectedDate && new Date(task.endTime) < nextDay,
        )
      } else {
        // If custom is selected but no date is picked, show no data
        filteredTasks = []
      }
    }

    // Apply project filter
    if (projectFilterValue !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.project === projectFilterValue)
    }

    const totalDuration = filteredTasks.reduce((sum, task) => sum + task.duration, 0)

    // Group by project and calculate stats
    const projects = {}

    filteredTasks.forEach((task) => {
      if (!projects[task.project]) {
        projects[task.project] = {
          duration: 0,
          color: getProjectColor(task.project),
        }
      }
      projects[task.project].duration += task.duration
    })

    const projectStats = Object.entries(projects)
      .map(([name, data]) => ({
        name,
        duration: data.duration,
        color: data.color,
        percentage: totalDuration > 0 ? Math.round((data.duration / totalDuration) * 100) : 0,
      }))
      .sort((a, b) => b.duration - a.duration)

    renderProjectStats(projectStats, totalDuration)
    renderPieChart(projectStats)
  }

  function getProjectColor(projectName) {
    const colors = [
      "#0077b6",
      "#03045e",
      "#4cc9f0",
      "#7209b7",
      "#f72585",
      "#4361ee",
      "#3a0ca3",
      "#7209b7",
      "#f72585",
      "#4cc9f0",
    ]

    let hash = 0
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  function renderProjectStats(projectStats, totalDuration) {
    projectStatsContainer.innerHTML = ""

    if (projectStats.length === 0) {
      projectStatsContainer.innerHTML = '<p class="no-data">No data available for the selected filters.</p>'
      return
    }

    projectStats.forEach((project) => {
      const statElement = document.createElement("div")
      statElement.className = "project-stat"

      statElement.innerHTML = `
                <div class="project-name">${project.name}</div>
                <div class="project-time">
                    <span>${formatTime(project.duration)}</span>
                    <span>${project.percentage}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${project.percentage}%; background-color: ${project.color}"></div>
                </div>
            `

      projectStatsContainer.appendChild(statElement)
    })

    // Add total duration
    const totalElement = document.createElement("div")
    totalElement.className = "project-stat total"
    totalElement.innerHTML = `
            <div class="project-name">Total</div>
            <div class="project-time">
                <span>${formatTime(totalDuration)}</span>
                <span>100%</span>
            </div>
        `

    projectStatsContainer.appendChild(totalElement)
  }

  function renderPieChart(projectStats) {
    const ctx = pieChartCanvas.getContext("2d")
    const width = pieChartCanvas.width
    const height = pieChartCanvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    // Clear previous chart
    ctx.clearRect(0, 0, width, height)

    if (projectStats.length === 0) {
      noDataMessagePie.classList.remove("hidden") // Use renamed ID
      pieChartCanvas.style.display = "none"
      return
    }

    noDataMessagePie.classList.add("hidden") // Use renamed ID
    pieChartCanvas.style.display = "block"

    let startAngle = 0

    projectStats.forEach((project) => {
      const sliceAngle = (project.percentage / 100) * 2 * Math.PI

      // Draw the slice
      ctx.beginPath()
      ctx.fillStyle = project.color
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()
      ctx.fill()

      // Add stroke
      ctx.strokeStyle = "var(--white)"
      ctx.lineWidth = 2
      ctx.stroke()

      startAngle += sliceAngle
    })

    // Draw center circle for donut effect
    ctx.beginPath()
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--white")
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI)
    ctx.fill()

    // Add total time in center
    const totalDuration = projectStats.reduce((sum, project) => sum + project.duration, 0)
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--dark-blue")
    ctx.font = "bold 16px Inter"
    ctx.textAlign = "center"
    ctx.fillText("Total", centerX, centerY - 8)
    ctx.font = "14px Inter"
    ctx.fillText(formatTime(totalDuration), centerX, centerY + 12)
  }

  function updateProjectFilter() {
    const projects = [...new Set(tasks.map((task) => task.project))]

    projectFilter.innerHTML = '<option value="all">All Projects</option>'

    projects.forEach((project) => {
      const option = document.createElement("option")
      option.value = project
      option.textContent = project
      projectFilter.appendChild(option)
    })
  }

  // Utility Functions
  function saveTasks() {
    localStorage.setItem("clokd_tasks", JSON.stringify(tasks))
  }

  function showError(errorId, message) {
    const errorElement = document.getElementById(errorId)
    if (errorElement) {
      errorElement.textContent = message
      errorElement.style.display = "block"
    }
  }

  function clearError(errorId) {
    const errorElement = document.getElementById(errorId)
    if (errorElement) {
      errorElement.textContent = ""
      errorElement.style.display = "none"
    }
  }

  function clearAllErrors() {
    const errorElements = document.querySelectorAll(".error-message")
    errorElements.forEach((element) => {
      element.textContent = ""
      element.style.display = "none"
    })
  }

  function downloadPDF() {
    const timeFilterValue = timeFilter.value
    const projectFilterValue = projectFilter.value

    let filteredTasks = [...tasks]

    // Apply filters (same logic as updateReports)
    const now = new Date()

    if (timeFilterValue === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      filteredTasks = filteredTasks.filter((task) => new Date(task.endTime) >= todayStart)
    } else if (timeFilterValue === "week") {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const weekStart = new Date(now.setDate(diff))
      weekStart.setHours(0, 0, 0, 0)
      filteredTasks = filteredTasks.filter((task) => new Date(task.endTime) >= weekStart)
    } else if (timeFilterValue === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      filteredTasks = filteredTasks.filter((task) => new Date(task.endTime) >= monthStart)
    } else if (timeFilterValue === "custom") {
      const selectedDateString = customDateInput.value
      if (selectedDateString) {
        const selectedDate = new Date(selectedDateString)
        selectedDate.setHours(0, 0, 0, 0)
        const nextDay = new Date(selectedDate)
        nextDay.setDate(selectedDate.getDate() + 1)

        filteredTasks = filteredTasks.filter(
          (task) => new Date(task.endTime) >= selectedDate && new Date(task.endTime) < nextDay,
        )
      } else {
        filteredTasks = []
      }
    }

    if (projectFilterValue !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.project === projectFilterValue)
    }

    generatePDF(filteredTasks, timeFilterValue, projectFilterValue)
  }

  function generatePDF(tasks, timeFilter, projectFilter) {
    // Create a new window for the PDF content
    const printWindow = window.open("", "_blank")

    const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0)
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

    // Generate HTML content for PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>CLOKD Time Report</title>
            <style>
                body { 
                    font-family: 'Inter', Arial, sans-serif; 
                    margin: 40px; 
                    color: #333; 
                    line-height: 1.6;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #0077b6; 
                    padding-bottom: 20px;
                }
                .header h1 { 
                    color: #03045e; 
                    margin: 0; 
                    font-size: 2.5rem;
                }
                .header p { 
                    color: #666; 
                    margin: 10px 0 0 0;
                }
                .summary { 
                    background: #caf0f8; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .summary-item { 
                    text-align: center;
                }
                .summary-item h3 { 
                    color: #03045e; 
                    margin: 0 0 5px 0;
                }
                .summary-item p { 
                    margin: 0; 
                    font-size: 1.2rem; 
                    font-weight: 600;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                th, td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid #ddd;
                }
                th { 
                    background: #03045e; 
                    color: white; 
                    font-weight: 600;
                }
                tr:nth-child(even) { 
                    background: #f8f9fa;
                }
                .tag { 
                    display: inline-block; 
                    padding: 2px 8px; 
                    border-radius: 12px; 
                    font-size: 12px; 
                    margin: 2px;
                    color: white;
                }
                .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    color: #666; 
                    font-size: 14px;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
                @media print {
                    body { margin: 20px; }
                    .header h1 { font-size: 2rem; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CLOKD Time Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()} • Filter: ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}${projectFilter !== "all" ? ` • Project: ${projectFilter}` : ""}</p>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <h3>Total Entries</h3>
                    <p>${tasks.length}</p>
                </div>
                <div class="summary-item">
                    <h3>Total Time</h3>
                    <p>${formatTime(totalDuration)}</p>
                </div>
                <div class="summary-item">
                    <h3>Average per Entry</h3>
                    <p>${tasks.length > 0 ? formatTime(Math.floor(totalDuration / tasks.length)) : "00:00:00"}</p>
                </div>
            </div>
            
            ${
              tasks.length > 0
                ? `
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Project</th>
                        <th>Tags</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedTasks
                      .map(
                        (task) => `
                        <tr>
                            <td><strong>${task.taskName}</strong></td>
                            <td>${task.project}</td>
                            <td>
                                ${task.tags
                                  .map(
                                    (tag) =>
                                      `<span class="tag" style="background-color: ${tag.color}">${tag.name}</span>`,
                                  )
                                  .join("")}
                            </td>
                            <td>${formatDateTime(new Date(task.startTime))}</td>
                            <td>${formatDateTime(new Date(task.endTime))}</td>
                            <td><strong>${formatTime(task.duration)}</strong></td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            `
                : '<p style="text-align: center; color: #666; font-style: italic;">No time entries found for the selected filters.</p>'
            }
            
            <div class="footer">
                <p>Generated by CLOKD Time Tracking App • Track your time, achieve your goals</p>
            </div>
        </body>
        </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }
})
