"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    $: unknown;
    tnerLoaded: boolean;
    initializeDatepickers: (start: string, end: string) => void;
    csctnCall: (params: Record<string, unknown>) => void;
  }
}

export default function TicketNetworkWidget() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    function addCss(href: string, id: string) {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.id = id;
      link.href = href;
      document.head.appendChild(link);
    }

    function addJs(src: string, id: string, onload?: () => void) {
      if (document.getElementById(id)) {
        onload?.();
        return;
      }
      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      if (onload) script.onload = onload;
      document.head.appendChild(script);
    }

    function runWidget() {
      const check = setInterval(() => {
        if (typeof window.tnerLoaded !== "undefined" && window.tnerLoaded === true) {
          window.initializeDatepickers(
            "#tner-stored-date-start_x2dgny",
            "#tner-stored-date-end_x2dgny"
          );
          window.csctnCall({
            page: 1,
            guid: "_x2dgny",
            container: "#tner-results_x2dgny",
            filters: "q=*&filter=_metadata/hasTickets eq true and date/date le 2028-06-15",
            specialFilters: "&includeFacets=true",
            target: "_self",
            url: "http://TicketNetwork.7eer.net/c/7341108/133430/2322?u=",
            perPage: "20",
            state: "abbr",
            country: "",
            pricing: "lowPrice",
            count: "yes",
          });
          clearInterval(check);
        }
      }, 20);
    }

    function initWidget() {
      addCss("https://venuefiles.s3.amazonaws.com/css/csctn-results-v3.css", "csctn-results-css");
      addJs("https://venuefiles.s3.amazonaws.com/js/csctn-results-v3.js", "csctn-results-js", runWidget);
    }

    if (typeof window.$ === "undefined") {
      addJs(
        "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js",
        "csctn-jquery",
        initWidget
      );
    } else {
      initWidget();
    }
  }, []);

  return (
    <div id="tner-container_x2dgny" className="tner-container" data-guid="_x2dgny">
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: `.tner-day-full{display:none}.tner-month-num,.tner-month-full{display:none}.tner-year-full{display:block}` }} />

      {/* ── Filters ─────────────────────────────── */}
      <div id="tner-filters-container_x2dgny" className="tner-filters-container">
        <input id="tner-filter-storage_x2dgny" className="tner-filter-storage" hidden />
        <ul id="tner-filters_x2dgny" className="tner-filters">

          {/* Date filter */}
          <li id="tner-date-filter_x2dgny" className="tner-date-filter tner-filter-tab">
            <a className="tner-filter-title tner-block" href="#">
              <span className="tner-filter-title-text">Dates</span>
            </a>
            <div className="tner-filter-dropdown">
              <form id="tner-date-filters_x2dgny" className="tner-date-filters tner-filter-form tner-block">
                <ul className="tner-filter-options tner-col-3">
                  <li id="tner-date-filter-range_x2dgny" className="tner-date-filter-range">
                    <span className="tner-filter-heading">Date Range</span>
                    <ul>
                      <li className="tner-filter-item tner-date-option">
                        <input
                          id="tner-stored-date-start_x2dgny"
                          className="tner-stored-date-start tner-date-input tner-filter-option tner-solo-input"
                          name="tner-date-filter-start"
                          data-filter="date-start"
                          placeholder="From"
                        />
                      </li>
                      <li className="tner-filter-item tner-date-option">
                        <input
                          id="tner-stored-date-end_x2dgny"
                          className="tner-stored-date-end tner-date-input tner-filter-option tner-solo-input"
                          name="tner-date-filter-end"
                          data-filter="date-end"
                          placeholder="To"
                        />
                      </li>
                    </ul>
                  </li>
                  <li id="tner-date-filter-day_x2dgny" className="tner-date-filter-day">
                    <span className="tner-filter-heading">Day of Week</span>
                    <ul id="tner-date_weekday_x2dgny" data-filter="date-day" className="tner-date_weekday tner-filter-checkbox-group" />
                  </li>
                  <li id="date-filter-time_x2dgny" className="tner-date-filter-time">
                    <span className="tner-filter-heading">Time of Day</span>
                    <ul id="tner-time_of_day_x2dgny" data-filter="date-time" className="tner-time_of_day tner-filter-checkbox-group" />
                  </li>
                </ul>
                <div className="tner-filter-control">
                  <button form="tner-date-filters_x2dgny" className="tner-clear-filters tner-filter-control-btn tner-btn" type="reset">Clear</button>
                  <button form="tner-date-filters_x2dgny" className="tner-apply-filters tner-filter-control-btn tner-btn" type="submit">Apply</button>
                </div>
              </form>
            </div>
          </li>

          {/* Performer filter */}
          <li id="tner-performer-filter_x2dgny" className="tner-performer-filter tner-filter-tab">
            <a className="tner-filter-title tner-block" href="#">
              <span className="tner-filter-title-text">Performers</span>
            </a>
            <div className="tner-filter-dropdown">
              <form id="tner-performer-filters_x2dgny" className="tner-performer-filters tner-filter-form tner-block">
                <ul id="tner-performer_list_x2dgny" data-filter="performer" className="tner-performer_list tner-filter-checkbox-group tner-filter-options tner-col-3" />
                <div className="tner-filter-control">
                  <button form="tner-performer-filters_x2dgny" className="tner-clear-filters tner-filter-control-btn tner-btn" type="reset">Clear</button>
                  <button form="tner-performer-filters_x2dgny" className="tner-apply-filters tner-filter-control-btn tner-btn" type="submit">Apply</button>
                </div>
              </form>
            </div>
          </li>

          {/* City filter */}
          <li id="tner-city-filter_x2dgny" className="tner-city-filter tner-filter-tab">
            <a className="tner-filter-title tner-block" href="#">
              <span className="tner-filter-title-text">Cities</span>
            </a>
            <div className="tner-filter-dropdown">
              <form id="tner-city-filters_x2dgny" className="tner-city-filters tner-filter-form tner-block">
                <ul id="tner-city_and_state_x2dgny" data-filter="city" className="tner-city_and_state tner-filter-checkbox-group tner-filter-options tner-col-3" />
                <div className="tner-filter-control">
                  <button form="tner-city-filters_x2dgny" className="tner-clear-filters tner-filter-control-btn tner-btn" type="reset">Clear</button>
                  <button form="tner-city-filters_x2dgny" className="tner-apply-filters tner-filter-control-btn tner-btn" type="submit">Apply</button>
                </div>
              </form>
            </div>
          </li>

          {/* Venue filter (hidden by default per original widget) */}
          <li id="tner-venue-filter_x2dgny" className="tner-venue-filter tner-filter-tab" style={{ display: "none" }}>
            <a href="#" className="tner-filter-title tner-block">
              <span>Venues</span>
            </a>
            <div className="tner-filter-dropdown">
              <form id="tner-venue-filters_x2dgny" className="tner-filter-form tner-block">
                <ul id="tner-venue_name_x2dgny" data-filter="venue" className="tner-venue_name tner-filter-checkbox-group tner-filter-options tner-col-3" />
                <div className="tner-filter-control">
                  <button form="tner-venue-filters_x2dgny" className="tner-clear-filters tner-filter-control-btn tner-btn" type="reset">Clear</button>
                  <button form="tner-venue-filters_x2dgny" className="tner-apply-filters tner-filter-control-btn tner-btn" type="submit">Apply</button>
                </div>
              </form>
            </div>
          </li>
        </ul>

        <div id="tner-filter-spacer_x2dgny" className="tner-filter-spacer" />
        <div id="tner-filter-tags-container_x2dgny" className="tner-filter-tags-container">
          <ul id="tner-filter-tags_x2dgny" className="tner-filter-tags" />
        </div>
      </div>

      {/* ── Results ─────────────────────────────── */}
      <div id="tner-results_x2dgny" className="tner-list-container">
        <input id="tner-call-storage_x2dgny" className="tner-call-storage" hidden />
        <a className="tner-more" href="#">
          <span className="tner-more-text">Load More</span>
        </a>
      </div>
    </div>
  );
}
