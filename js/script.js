/* ==========================================================================
   JavaScript Programming Activities
   --------------------------------------------------------------------------
   Contents
     1. Shared helpers (validation, formatting, result display)
     2. Sidebar navigation (hash based, no page reloads)
     2b. Light / dark theme toggle
     3. Assignment 1 - Conversion calculator
     4. Assignment 2 - Income tax calculator
     5. Assignment 3 - Factorial (while), Sum (do...while), Average (for)
     6. Assignment 4 - Simple payroll
     7. init() - wires every control once the page has loaded

   All calculation functions are plain, self-contained functions so they can be
   read and tested on their own. Nothing touches the page until init() runs.
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     1. SHARED HELPERS
     ====================================================================== */

  /**
   * Reads and validates a number typed into an input element.
   * Returns { ok: true, value: Number } or { ok: false, message: String }.
   *
   * options.label    - friendly field name used in error messages
   * options.min      - smallest accepted value
   * options.max      - largest accepted value
   * options.integer  - true when only whole numbers are accepted
   */
  function readNumber(input, options) {
    var opts = options || {};
    var label = opts.label || 'Value';
    var raw = input.value.trim();

    // Empty input: checked before Number() because Number('') is 0.
    if (raw === '') {
      return { ok: false, message: 'Please enter a value.' };
    }

    var value = Number(raw);

    // Catches letters, symbols, and values such as Infinity.
    if (!isFinite(value)) {
      return { ok: false, message: 'Please enter a valid number.' };
    }

    if (opts.integer && Math.floor(value) !== value) {
      return { ok: false, message: label + ' must be a whole number.' };
    }

    if (typeof opts.min === 'number' && value < opts.min) {
      return {
        ok: false,
        message: opts.min === 0
          ? label + ' cannot be negative.'
          : label + ' must be at least ' + formatNumber(opts.min) + '.'
      };
    }

    if (typeof opts.max === 'number' && value > opts.max) {
      return {
        ok: false,
        message: label + ' must not be greater than ' + formatNumber(opts.max) + '.'
      };
    }

    return { ok: true, value: value };
  }

  /** Formats a number with thousands separators and a fixed number of decimals. */
  function formatNumber(value, decimals) {
    var places = (typeof decimals === 'number') ? decimals : 0;
    return value.toLocaleString('en-PH', {
      minimumFractionDigits: places,
      maximumFractionDigits: places
    });
  }

  /** Formats a value the user typed, keeping any decimals they entered. */
  function formatEntered(value) {
    return value.toLocaleString('en-PH', { maximumFractionDigits: 6 });
  }

  /** Formats a peso amount, e.g. 20080 -> "PHP 20,080.00" with the peso sign. */
  function formatPeso(value) {
    return '₱' + formatNumber(value, 2);
  }

  /** Escapes text that gets inserted into result HTML (e.g. the employee name). */
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Shows a successful result inside a result panel. */
  function showResult(panel, html) {
    panel.innerHTML = html;
    panel.classList.add('is-ok');
    panel.classList.remove('is-error');
    panel.hidden = false;
  }

  /** Shows a validation or error message inside a result panel. */
  function showError(panel, message) {
    panel.textContent = message;
    panel.classList.add('is-error');
    panel.classList.remove('is-ok');
    panel.hidden = false;
  }

  /**
   * Prefixes an error with the field name, but only when the message does not
   * already begin with it - avoids "Hourly rate: Hourly rate cannot be negative."
   */
  function fieldError(label, message) {
    return message.indexOf(label) === 0 ? message : label + ': ' + message;
  }

  /** Builds the standard "LABEL / big value" result markup. */
  function resultBlock(label, value, note) {
    var html = '<span class="result__label">' + label + '</span>' +
               '<span class="result__value">' + value + '</span>';
    if (note) {
      html += '<p class="result__note">' + note + '</p>';
    }
    return html;
  }

  /* ======================================================================
     2. SIDEBAR NAVIGATION

     Every assignment lives in its own <section class="view"> inside the page.
     Switching views only toggles a CSS class, so the browser never reloads.
     The URL hash keeps track of the current view, which also makes links such
     as index.html#assignment-3 work and keeps the back button functional.
     ====================================================================== */

  var VIEW_IDS = ['home', 'assignment-1', 'assignment-2', 'assignment-3', 'assignment-4'];
  var MOBILE_BREAKPOINT = 900;

  /** Shows one view and highlights its matching sidebar link. */
  function showView(requestedId) {
    // Unknown or empty hash falls back to the homepage.
    var targetId = VIEW_IDS.indexOf(requestedId) !== -1 ? requestedId : 'home';

    VIEW_IDS.forEach(function (viewId) {
      var section = document.getElementById(viewId);
      if (section) {
        section.classList.toggle('is-active', viewId === targetId);
      }
    });

    var links = document.querySelectorAll('.nav-link');
    Array.prototype.forEach.call(links, function (link) {
      var isActive = link.getAttribute('data-view') === targetId;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    window.scrollTo(0, 0);
    closeNav();
  }

  /** Reads the view id out of the current URL hash. */
  function viewIdFromHash() {
    return window.location.hash.replace(/^#/, '');
  }

  function openNav() {
    document.body.classList.add('nav-open');
    document.getElementById('backdrop').hidden = false;
    var toggle = document.getElementById('menuToggle');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    var backdrop = document.getElementById('backdrop');
    if (backdrop) {
      backdrop.hidden = true;
    }
    var toggle = document.getElementById('menuToggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
    }
  }

  function setUpNavigation() {
    // Respond to hash changes: sidebar clicks, home cards, and the back button.
    window.addEventListener('hashchange', function () {
      showView(viewIdFromHash());
    });

    // Clicking the link of the view you are already on does not fire
    // hashchange, so close the mobile drawer here as well.
    var links = document.querySelectorAll('.nav-link');
    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener('click', closeNav);
    });

    document.getElementById('menuToggle').addEventListener('click', function () {
      if (document.body.classList.contains('nav-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    document.getElementById('backdrop').addEventListener('click', closeNav);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeNav();
      }
    });

    // Never leave the drawer state hanging when resizing up to desktop.
    window.addEventListener('resize', function () {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        closeNav();
      }
    });

    // Show the correct view on first load.
    showView(viewIdFromHash());
  }

  /* ======================================================================
     2b. LIGHT / DARK THEME

     The theme is stored as a data-theme attribute on <html>; css/style.css
     defines one palette per value. A small bootstrap script in index.html
     applies the stored theme before the first paint, and the code here keeps
     the toggle button in step and saves the visitor's choice.
     ====================================================================== */

  var THEME_KEY = 'jsActivities.theme';
  var DARK = 'dark';
  var LIGHT = 'light';

  /** Reads the saved choice. Wrapped because localStorage can throw. */
  function readSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (error) {
      return null;   // private browsing, or storage disabled
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      /* Saving is a nicety - the site still works without it. */
    }
  }

  /** True when the operating system is set to dark mode. */
  function systemPrefersDark() {
    return !!(window.matchMedia &&
              window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  /** The theme currently shown on screen. */
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === DARK ? DARK : LIGHT;
  }

  /** Applies a theme and updates the toggle button to match. */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    var icon = document.getElementById('themeIcon');
    var label = document.getElementById('themeLabel');
    var isDark = theme === DARK;

    // The button describes what the next click will do.
    if (icon) {
      icon.innerHTML = isDark ? '&#9728;' : '&#9790;';   // sun : moon
    }
    if (label) {
      label.textContent = isDark ? 'Light mode' : 'Dark mode';
    }
  }

  function setUpThemeToggle() {
    // The bootstrap in index.html already set the attribute; this syncs the
    // button text with it (and covers the case where that script was skipped).
    var saved = readSavedTheme();
    applyTheme(saved === LIGHT || saved === DARK
      ? saved
      : (systemPrefersDark() ? DARK : LIGHT));

    document.getElementById('themeToggle').addEventListener('click', function () {
      var next = currentTheme() === DARK ? LIGHT : DARK;
      applyTheme(next);
      saveTheme(next);
    });

    // Follow the operating system while the visitor has not chosen for
    // themselves. Once they click the toggle, their choice sticks.
    if (window.matchMedia) {
      var query = window.matchMedia('(prefers-color-scheme: dark)');
      var onSystemChange = function (event) {
        if (!readSavedTheme()) {
          applyTheme(event.matches ? DARK : LIGHT);
        }
      };

      if (query.addEventListener) {
        query.addEventListener('change', onSystemChange);
      } else if (query.addListener) {
        query.addListener(onSystemChange);   // older browsers
      }
    }
  }

  /* ======================================================================
     3. ASSIGNMENT 1 - CONVERSION CALCULATOR

     Each conversion is one entry in this table. To add another conversion,
     add an entry here: the dropdown is built from this object automatically.
     ====================================================================== */

  var CONVERSIONS = {
    'c-to-f': {
      label: 'Celsius to Fahrenheit',
      fromUnit: '°C',
      toUnit: '°F',
      hint: 'Enter the temperature in degrees Celsius. Negative values are allowed.',
      allowNegative: true,
      convert: function (value) { return value * 9 / 5 + 32; }
    },
    'f-to-c': {
      label: 'Fahrenheit to Celsius',
      fromUnit: '°F',
      toUnit: '°C',
      hint: 'Enter the temperature in degrees Fahrenheit. Negative values are allowed.',
      allowNegative: true,
      convert: function (value) { return (value - 32) * 5 / 9; }
    },
    'm-to-ft': {
      label: 'Meters to Feet',
      fromUnit: 'm',
      toUnit: 'ft',
      hint: 'Enter the length in meters (1 foot = 0.3048 meters).',
      allowNegative: false,
      convert: function (value) { return value / 0.3048; }
    },
    'ft-to-m': {
      label: 'Feet to Meters',
      fromUnit: 'ft',
      toUnit: 'm',
      hint: 'Enter the length in feet (1 foot = 0.3048 meters).',
      allowNegative: false,
      convert: function (value) { return value * 0.3048; }
    }
  };

  function setUpConversionCalculator() {
    var typeSelect = document.getElementById('conv-type');
    var valueInput = document.getElementById('conv-value');
    var hint = document.getElementById('conv-hint');
    var panel = document.getElementById('conv-result');

    // Build the dropdown from the CONVERSIONS table.
    Object.keys(CONVERSIONS).forEach(function (key) {
      var option = document.createElement('option');
      option.value = key;
      option.textContent = CONVERSIONS[key].label;
      typeSelect.appendChild(option);
    });

    /** Keeps the hint in step with the selected conversion. */
    function refreshHint() {
      hint.textContent = CONVERSIONS[typeSelect.value].hint;
    }

    refreshHint();

    // Changing the conversion type clears the old result so it cannot be
    // mistaken for the new conversion.
    typeSelect.addEventListener('change', function () {
      refreshHint();
      panel.hidden = true;
    });

    document.getElementById('conv-btn').addEventListener('click', function () {
      var conversion = CONVERSIONS[typeSelect.value];

      var input = readNumber(valueInput, {
        label: 'Length',
        min: conversion.allowNegative ? undefined : 0
      });

      if (!input.ok) {
        showError(panel, input.message);
        return;
      }

      var converted = conversion.convert(input.value);

      showResult(panel, resultBlock(
        conversion.label,
        formatEntered(input.value) + ' ' + conversion.fromUnit + ' = ' +
          formatNumber(converted, 2) + ' ' + conversion.toUnit
      ));
    });

    // Pressing Enter in the field runs the conversion.
    valueInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        document.getElementById('conv-btn').click();
      }
    });
  }

  /* ======================================================================
     4. ASSIGNMENT 2 - INCOME TAX CALCULATOR

     Philippine graduated income tax rates on annual taxable income,
     effective January 1, 2023 (TRAIN Law, RA 10963).

     Each bracket means: for income above `over`, the tax is
     `baseTax` plus `rate` of the amount in excess of `over`.
     The brackets are listed from lowest to highest - edit this table to
     change the rates without touching any other code.
     ====================================================================== */

  var TAX_BRACKETS = [
    { over: 0,         baseTax: 0,         rate: 0.00 },   // up to 250,000 is exempt
    { over: 250000,    baseTax: 0,         rate: 0.15 },
    { over: 400000,    baseTax: 22500,     rate: 0.20 },
    { over: 800000,    baseTax: 102500,    rate: 0.25 },
    { over: 2000000,   baseTax: 402500,    rate: 0.30 },
    { over: 8000000,   baseTax: 2202500,   rate: 0.35 }
  ];

  /**
   * Computes the income tax for a taxable annual income.
   * Walks the bracket table from the highest bracket downwards and uses the
   * first one the income exceeds.
   */
  function computeIncomeTax(income) {
    for (var i = TAX_BRACKETS.length - 1; i >= 0; i--) {
      var bracket = TAX_BRACKETS[i];
      if (income > bracket.over || i === 0) {
        return bracket.baseTax + bracket.rate * (income - bracket.over);
      }
    }
    return 0;
  }

  function setUpTaxCalculator() {
    var incomeInput = document.getElementById('tax-income');
    var panel = document.getElementById('tax-result');

    document.getElementById('tax-btn').addEventListener('click', function () {
      var input = readNumber(incomeInput, { label: 'Income', min: 0 });

      if (!input.ok) {
        showError(panel, input.message);
        return;
      }

      var tax = computeIncomeTax(input.value);

      showResult(panel,
        '<span class="result__label">Income Tax Due</span>' +
        '<table class="summary">' +
          '<tbody>' +
            '<tr><th>Taxable annual income</th><td>' + formatPeso(input.value) + '</td></tr>' +
            '<tr><th>Income tax</th><td>' + formatPeso(tax) + '</td></tr>' +
          '</tbody>' +
        '</table>'
      );
    });

    incomeInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        document.getElementById('tax-btn').click();
      }
    });
  }

  /* ======================================================================
     5. ASSIGNMENT 3 - FACTORIAL, SUM, AND AVERAGE

     The loop structure for each calculator is required by the assignment,
     so each function uses that exact loop instead of a formula.
     ====================================================================== */

  // 170! is the largest factorial a JavaScript number can hold; 171! is Infinity.
  var MAX_FACTORIAL_N = 170;
  // Upper limit for the sum/average loops so the page can never freeze.
  var MAX_N = 1000000;

  /** A. Factorial of n using a WHILE loop. */
  function factorialWhile(n) {
    var result = 1;
    var counter = 2;

    while (counter <= n) {
      result = result * counter;
      counter = counter + 1;
    }

    return result;  // 0! and 1! both correctly return 1
  }

  /** B. Sum of the first n natural numbers using a DO...WHILE loop. */
  function sumFirstNDoWhile(n) {
    var total = 0;
    var counter = 1;

    do {
      total = total + counter;
      counter = counter + 1;
    } while (counter <= n);

    return total;
  }

  /** C. Average of the first n natural numbers using a FOR loop. */
  function averageFirstNForLoop(n) {
    var total = 0;

    for (var counter = 1; counter <= n; counter++) {
      total = total + counter;
    }

    return total / n;
  }

  function setUpLoopCalculators() {
    /* ---- A. Factorial (while loop) ---- */
    var factInput = document.getElementById('fact-n');
    var factPanel = document.getElementById('fact-result');

    document.getElementById('fact-btn').addEventListener('click', function () {
      var input = readNumber(factInput, {
        label: 'N',
        min: 0,
        max: MAX_FACTORIAL_N,
        integer: true
      });

      if (!input.ok) {
        showError(factPanel, input.message);
        return;
      }

      var n = input.value;
      var factorial = factorialWhile(n);
      var display;
      var note = 'Calculated with a while loop.';

      // Past about 18! the exact value no longer fits in a JavaScript number,
      // so large results are shown in scientific notation instead.
      if (factorial <= Number.MAX_SAFE_INTEGER) {
        display = formatNumber(n) + '! = ' + formatNumber(factorial);
      } else {
        display = formatNumber(n) + '! ≈ ' + factorial.toExponential(6);
        note = 'Calculated with a while loop. Shown in scientific notation because ' +
               'the exact value exceeds the range JavaScript can store precisely.';
      }

      showResult(factPanel, resultBlock('Factorial', display, note));
    });

    /* ---- B. Sum (do...while loop) ---- */
    var sumInput = document.getElementById('sum-n');
    var sumPanel = document.getElementById('sum-result');

    document.getElementById('sum-btn').addEventListener('click', function () {
      var input = readNumber(sumInput, {
        label: 'N',
        min: 1,
        max: MAX_N,
        integer: true
      });

      if (!input.ok) {
        showError(sumPanel, input.message);
        return;
      }

      var n = input.value;
      var total = sumFirstNDoWhile(n);

      showResult(sumPanel, resultBlock(
        'Sum of the first ' + formatNumber(n) + ' natural numbers',
        formatNumber(total),
        'Calculated with a do...while loop.'
      ));
    });

    /* ---- C. Average (for loop) ---- */
    var avgInput = document.getElementById('avg-n');
    var avgPanel = document.getElementById('avg-result');

    document.getElementById('avg-btn').addEventListener('click', function () {
      var input = readNumber(avgInput, {
        label: 'N',
        min: 1,
        max: MAX_N,
        integer: true
      });

      if (!input.ok) {
        showError(avgPanel, input.message);
        return;
      }

      var n = input.value;
      var average = averageFirstNForLoop(n);

      showResult(avgPanel, resultBlock(
        'Average of the first ' + formatNumber(n) + ' natural numbers',
        formatNumber(average, 2),
        'Calculated with a for loop.'
      ));
    });

    // Enter key support for all three fields.
    [['fact-n', 'fact-btn'], ['sum-n', 'sum-btn'], ['avg-n', 'avg-btn']]
      .forEach(function (pair) {
        document.getElementById(pair[0]).addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            document.getElementById(pair[1]).click();
          }
        });
      });
  }

  /* ======================================================================
     6. ASSIGNMENT 4 - SIMPLE PAYROLL
     ====================================================================== */

  /** Gross Salary = Hourly Rate x Hours Worked */
  function computeGrossSalary(hourlyRate, hoursWorked) {
    return hourlyRate * hoursWorked;
  }

  function setUpPayrollCalculator() {
    var nameInput = document.getElementById('pay-name');
    var rateInput = document.getElementById('pay-rate');
    var hoursInput = document.getElementById('pay-hours');
    var panel = document.getElementById('pay-result');

    document.getElementById('pay-btn').addEventListener('click', function () {
      var name = nameInput.value.trim();

      if (name === '') {
        showError(panel, 'Please enter the employee name.');
        return;
      }

      var rate = readNumber(rateInput, { label: 'Hourly rate', min: 0 });
      if (!rate.ok) {
        showError(panel, fieldError('Hourly rate', rate.message));
        return;
      }

      var hours = readNumber(hoursInput, { label: 'Hours worked', min: 0 });
      if (!hours.ok) {
        showError(panel, fieldError('Hours worked', hours.message));
        return;
      }

      var grossSalary = computeGrossSalary(rate.value, hours.value);

      showResult(panel,
        '<span class="result__label">Payroll Summary</span>' +
        '<table class="summary">' +
          '<tbody>' +
            '<tr><th>Employee name</th><td>' + escapeHtml(name) + '</td></tr>' +
            '<tr><th>Hourly rate</th><td>' + formatPeso(rate.value) + '</td></tr>' +
            '<tr><th>Hours worked</th><td>' + formatEntered(hours.value) + '</td></tr>' +
            '<tr><th>Gross salary</th><td>' + formatPeso(grossSalary) + '</td></tr>' +
          '</tbody>' +
        '</table>'
      );
    });

    // Enter key support on every payroll field.
    [nameInput, rateInput, hoursInput].forEach(function (field) {
      field.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          document.getElementById('pay-btn').click();
        }
      });
    });
  }

  /* ======================================================================
     7. INIT - run everything once the DOM is ready
     ====================================================================== */

  function init() {
    setUpThemeToggle();
    setUpNavigation();
    setUpConversionCalculator();
    setUpTaxCalculator();
    setUpLoopCalculators();
    setUpPayrollCalculator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposed so the calculations can be checked from the browser console.
  window.ActivityCalculations = {
    computeIncomeTax: computeIncomeTax,
    factorialWhile: factorialWhile,
    sumFirstNDoWhile: sumFirstNDoWhile,
    averageFirstNForLoop: averageFirstNForLoop,
    computeGrossSalary: computeGrossSalary,
    conversions: CONVERSIONS,
    taxBrackets: TAX_BRACKETS
  };
}());
