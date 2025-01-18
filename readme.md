# UI Development Plan for Monitoring System

## Main Dashboard

### Features:
1. **Quick Stats Overview**
   - Total Active Targets
   - TLD Distribution (e.g., .ee, .lt, .lv)
   - Latest Update Time
   - Recent Changes

2. **TLD Distribution**
   - Visualize the distribution of TLDs.
   - Highlight trends and anomalies.

3. **Recent Targets**
   - List of recently added or updated targets.
   - Show key details like domain, first seen, and last update.

4. **Alert Notifications**
   - Display active alerts.
   - Provide links to view more details.

---

## Search Interface

### Features:
1. **Search by Domain/IP**
   - Query specific domains or IP addresses.
   - Display related historical data.

2. **Historical Data Viewing**
   - Present a timeline of targeting for selected domains.
   - Show first and last appearance with details.

3. **Timeline Visualization**
   - Graphical representation of targeting trends.
   - Highlight peak periods and changes.

4. **Attack Patterns Display**
   - List of methods and configurations used against a target.
   - Categorize by severity and frequency.

---

## Monitoring Panel

### Features:
1. **Current Status**
   - Display the real-time state of monitored domains.
   - Indicate issues or changes.

2. **Last Check Time**
   - Show when the last monitoring cycle occurred.

3. **Next Check Countdown**
   - Provide a timer for the next scheduled check.

4. **Force Check Button**
   - Allow manual initiation of checks.

---

## Domain Details View

### Features:
1. **Historical Timeline**
   - Detailed history of targeting events.
   - Highlight major changes in patterns.

2. **Attack Method Changes**
   - Show shifts in methods used against the domain.
   - Highlight new or deprecated attack types.

3. **Related Domains**
   - List domains with similar attack patterns.
   - Group by organization or infrastructure similarities.

4. **Current Status**
   - Real-time state of the domain.
   - Show recent updates and changes.

---

## Prioritization Plan

### Why Start with the Main Dashboard?
1. **Show Data Flow:** Validate that backend services are functioning correctly.
2. **Immediate Value:** Provide actionable insights to users right away.
3. **System Visualization:** Understand the overall state of the system.
4. **Service Validation:** Ensure data integration and metrics display as expected.

---

## Implementation Plan

### Dashboard Components:
1. **Dashboard Layout**
   - Header with title and status indicators.
   - Quick stats cards row.
   - Main content area split into panels.

2. **Stats Cards**
   - Total Active Targets.
   - TLD Distribution.
   - Latest Update Time.
   - Recent Changes.

3. **Main Panels**
   - **TargetList.tsx:** Recent targets.
   - **TLDChart.tsx:** TLD distribution visualization.
   - **ActivityFeed.tsx:** Recent changes and updates.

### Data Flow Decisions:
1. **Real-Time Updates vs Polling**
   - Opt for polling initially.
   - Decide on refresh intervals based on performance testing.

2. **Metrics to Show First**
   - Total targets.
   - TLD trends.
   - Recent activity.

---

## Refined Use Cases

### Domain Tracking:
- "Show all instances where `mail.gov.lv` appeared as a target."
- "When was `luminor.ee` first targeted, and how often since?"
- "List all subdomains of `riigikantselei.ee` that have been targeted."

### TLD/Regional Monitoring:
- "Show targeting trends for `.lt` domains over the last 3 months."
- "What percentage of targets are `.gov.ee` domains?"
- "Is there an increase in `.lv` domain targeting this week?"

### Attack Method Analysis:
- "What HTTP methods are being used against this domain?"
- "Has there been a shift from HTTP/2 to HTTP/3 attacks?"
- "Show all domains targeted with TCP SYN floods."

### Timeline Analysis:
- "Show the 10 longest-running targeted domains."
- "Which domains were added to targeting in the last 24 hours?"
- "What's the average duration a domain stays on their target list?"

### Configuration Changes:
- "Has the attack pattern against this domain changed?"
- "Show when new attack methods were added for this target."
- "Track changes in URL paths used against this domain."

### Pattern Detection:
- "Are attacks against `.gov` domains using different methods than others?"
- "What's the most common attack configuration for Baltic domains?"
- "Show domains that share similar attack patterns."

### Real-Time Monitoring:
- "Alert when any `.mil.ee` domain appears as a target."
- "Notify when attack methods change for monitored domains."
- "Track new domains added to target list."

### Historical Context:
- "Has this domain been targeted before?"
- "What was the largest campaign against `.lt` domains?"
- "Show historical targeting patterns for specific domains."

---

## Development Phases

### Phase 1: Core Data Processing & Storage
1. **File Processing System:**
   - Parse historical JSON files.
   - Create efficient storage structure.
   - Handle file naming patterns.
   - Build update mechanism for new files.

2. **Target Analysis Engine:**
   - Domain extraction.
   - TLD categorization.
   - Attack pattern classification.
   - Timeline tracking.

3. **Basic Search Functionality:**
   - Domain lookup.
   - Historical data retrieval.
   - Configuration matching.

### Phase 2: Monitoring & Alerting
1. **Live Feed Integration:**
   - Regular polling system.
   - Change detection.
   - Data validation.
   - Update processing.

2. **Alert System:**
   - Domain watch lists.
   - Pattern matching rules.
   - Alert generation.
   - Historical alert tracking.

### Phase 3: Frontend Development
1. **Dashboard Implementation:**
   - Quick stats display.
   - Recent activity feed.
   - TLD distribution charts.

2. **Search Interface:**
   - Advanced search options.
   - Results filtering.
   - Data visualization.

3. **Domain Details View:**
   - Historical timeline.
   - Attack pattern display.
   - Related targets.

---

## Project Structure

### Core Features
1. **Historical Analysis Database:**
   - Convert JSON files into a queryable format.
   - Index by target hosts, IPs, and attack patterns.
   - Track first/last seen dates for targets.
   - Store historical attack configurations.

2. **Real-Time Monitoring:**
   - Poll live feed periodically.
   - Compare new configurations against existing ones.
   - Track changes in attack patterns.
   - Alert on new targets or pattern changes.

3. **Client Asset Matching:**
   - Maintain list of client assets (domains/IPs).
   - Match against historical and new data.
   - Show targeting timeline for each asset.
   - Track attack pattern evolution.

### Key Features
1. **Search & Analysis:**
   - Search by domain/IP.
   - View historical targeting data.
   - Analyze attack patterns used.
   - Show campaign intensity over time.

2. **Alerting System:**
   - New target alerts.
   - Attack pattern change alerts.
   - Campaign intensity alerts.
   - Custom alert rules.

3. **Visualization Dashboard:**
   - Timeline views.
   - Attack pattern distribution.
   - Target frequency charts.
   - Campaign intensity graphs.

### Technical Implementation
1. **Data Storage:**
   - Use files as a database initially.
   - JSON files stored in structured format.
   - Indexed for quick searching.
   - Maintain data integrity.

2. **Update System:**
   - Regular polling of live feed.
   - Diff checking for changes.
   - Historical data preservation.
   - Data validation.

3. **Query Interface:**
   - Fast search capabilities.
   - Pattern matching.
   - Historical lookups.
   - Statistical analysis.

