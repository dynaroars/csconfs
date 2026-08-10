import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import './Stat.css';

// Function to generate gradient colors based on actual values
const getValueBasedColor = (value, maxValue, minValue) => {
  // Base blue color
  const baseHue = 210; // Blue hue
  const maxSaturation = 75; // Maximum saturation for highest values
  const minSaturation = 25; // Minimum saturation for lowest values
  const maxLightness = 25; // Darkest lightness for highest values
  const minLightness = 70; // Lightest lightness for lowest values
  
  // Calculate the ratio of this value compared to the range
  const valueRange = maxValue - minValue;
  const normalizedValue = valueRange === 0 ? 1 : (value - minValue) / valueRange;
  
  // Calculate saturation and lightness based on the actual value
  // Higher values get higher saturation and lower lightness (darker)
  const saturation = minSaturation + (maxSaturation - minSaturation) * normalizedValue;
  const lightness = minLightness - (minLightness - maxLightness) * normalizedValue;
  
  // Create solid colors
  const barColor = `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
  const borderColor = `hsl(${baseHue}, ${saturation + 10}%, ${Math.max(lightness - 10, 15)}%)`;
  
  return {
    bg: barColor,
    border: borderColor,
    text: `hsl(${baseHue}, ${saturation + 15}%, ${Math.max(lightness - 15, 10)}%)`
  };
};

/**
 * Horizontal bar list used for both the country and city breakdowns.
 * @param {Array<{label: string, count: number, percentage: number|string}>} items
 */
const BarList = ({ items }) => {
  const counts = items.map(d => d.count);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);

  return (
    <div className="stat-panel">
      {items.map(item => {
        const barWidth = (item.count / maxCount) * 100;
        const colors = getValueBasedColor(item.count, maxCount, minCount);

        return (
          <div className="stat-row" key={item.label}>
            <div className="stat-row-label">{item.label}</div>

            <div className="stat-bar-track">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${barWidth}%`,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderLeft: 'none',
                  boxShadow: `0 2px 4px ${colors.border}33`,
                }}
              />
              <span className="stat-bar-count" style={{ left: `calc(${barWidth}% + 8px)` }}>
                {item.count}
              </span>
            </div>

            <div className="stat-row-pct">{item.percentage}%</div>
          </div>
        );
      })}
    </div>
  );
};

// Function to extract country/region from place string
const extractCountryRegion = (place) => {
  if (!place || place.trim() === '') return null; // Return null instead of 'Unknown'
  
  // Handle special cases
  if (place.toLowerCase().includes('virtual') || place.toLowerCase().includes('online')) {
    return 'Online';
  }
  
  // Split by comma and take the last part (usually country)
  const parts = place.split(',').map(part => part.trim());
  
  if (parts.length === 1) {
    // Single location like "Singapore", "China"
    return parts[0];
  }
  
  // Multiple parts - determine country/region
  const lastPart = parts[parts.length - 1];
  
  // Handle US states (if last part is a 2-letter state code and previous part exists)
  const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
  
  if (usStates.includes(lastPart) && parts.length >= 2) {
    return 'USA';
  }
  
  // Handle UK variants
  if (lastPart === 'UK' || lastPart === 'United Kingdom') {
    return 'UK';
  }

  if (lastPart.toLowerCase().includes('korea')) {
    return 'Korea';
  }

  if (lastPart.toLowerCase().includes('czech')) {
    return 'Czech';
  }
  
  // Default to the last part (raw country name)
  return lastPart;
};

// Function to extract city from place string
const extractCity = (place) => {
  if (!place || place.trim() === '') return null;
  
  // Handle special cases
  if (place.toLowerCase().includes('virtual') || place.toLowerCase().includes('online')) {
    return 'Online';
  }
  
  // Split by comma and take the first part (usually city)
  const parts = place.split(',').map(part => part.trim());
  
  // Return the first part as the city
  return parts[0];
};

  const Stat = ({ conferences }) => {
  // Process conferences data for paper statistics over years
  const paperData = useMemo(() => {
    if (!conferences || conferences.length === 0) {
      return [];
    }
    
    // Group conferences by year and calculate statistics
    const yearlyStats = {};
    
    conferences.forEach(conf => {
      if (conf.year && (conf.num_submission || conf.acceptance_rate)) {
        const year = parseInt(conf.year);
        if (!yearlyStats[year]) {
          yearlyStats[year] = {
            year,
            totalSubmissions: 0,
            totalAccepted: 0,
            conferenceCount: 0,
            acceptanceRates: []
          };
        }
        
        // Add submission data if available
        if (conf.num_submission && conf.num_submission.toString().trim() !== '') {
          const submissions = parseInt(conf.num_submission.toString().replace(/,/g, ''));
          if (!isNaN(submissions) && submissions > 0) {
            yearlyStats[year].totalSubmissions += submissions;
            
            // Calculate accepted papers if acceptance rate is available
            if (conf.acceptance_rate && conf.acceptance_rate.toString().trim() !== '') {
              // Clean acceptance rate string - remove % symbol and extra spaces
              const rateStr = conf.acceptance_rate.toString().replace(/%/g, '').trim();
              const rate = parseFloat(rateStr);
              if (!isNaN(rate) && rate > 0) {
                const accepted = Math.round(submissions * (rate / 100));
                yearlyStats[year].totalAccepted += accepted;
                yearlyStats[year].acceptanceRates.push(rate);
              }
            }
          }
        }
        
        yearlyStats[year].conferenceCount++;
      }
    });
    
    // Convert to array and calculate average acceptance rates
    const sortedData = Object.values(yearlyStats)
      .map(yearData => ({
        year: yearData.year,
        submissions: yearData.totalSubmissions,
        accepted: yearData.totalAccepted,
        rejected: yearData.totalSubmissions - yearData.totalAccepted,
        acceptanceRate: yearData.acceptanceRates.length > 0 
          ? (yearData.acceptanceRates.reduce((sum, rate) => sum + rate, 0) / yearData.acceptanceRates.length).toFixed(1)
          : null,
        conferenceCount: yearData.conferenceCount
      }))
      .filter(data => data.submissions > 0) // Only include years with submission data
      .sort((a, b) => a.year - b.year);
    
    return sortedData;
  }, [conferences]);

  // Process conferences data to count by country/region
  const countryData = useMemo(() => {
    if (!conferences || conferences.length === 0) {
      return [];
    }
    
    // Count conferences by country/region
    const countryCount = {};
    const totalConferences = conferences.length;
    
    conferences.forEach(conf => {
      const country = extractCountryRegion(conf.place);
      if (country) { // Only count conferences with valid place data
        countryCount[country] = (countryCount[country] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count (descending)
    const sortedData = Object.entries(countryCount)
      .map(([country, count]) => ({
        country,
        count,
        percentage: ((count / totalConferences) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
    
    return sortedData;
  }, [conferences]);

  // Process conferences data to count by city
  const cityData = useMemo(() => {
    if (!conferences || conferences.length === 0) {
      return [];
    }
    
    // Count conferences by city
    const cityCount = {};
    const totalConferences = conferences.length;
    
    conferences.forEach(conf => {
      const city = extractCity(conf.place);
      if (city) { // Only count conferences with valid place data
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count (descending)
    const sortedData = Object.entries(cityCount)
      .map(([city, count]) => ({
        city,
        count,
        percentage: ((count / totalConferences) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
    
    return sortedData;
  }, [conferences]);
  
  if (!countryData || countryData.length === 0) {
    return (
      <div className="stat-empty">
        <h2 className="stat-heading">The Most Frequent Countries/Regions</h2>
        <p className="stat-muted">No conference data available to display statistics.</p>
      </div>
    );
  }

  return (
    <div className="stat">
      {/* Countries */}
      <h2 className="stat-heading">The Most Frequent Countries</h2>
      <BarList items={countryData.map(d => ({ ...d, label: d.country }))} />

      {/* Cities */}
      <h2 className="stat-heading">The Most Frequent Cities</h2>
      <BarList items={cityData.map(d => ({ ...d, label: d.city }))} />

      {/* Paper Statistics Chart */}
      {paperData && paperData.length > 0 && (
        <>
          <h2 className="stat-heading">Paper Statistics Over Years</h2>

          <div className="stat-chart-panel">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paperData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#d1d5db"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: 'currentColor', fontWeight: '500' }}
                  axisLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: 'currentColor', fontWeight: '500' }}
                  label={{ value: 'Number of Papers', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'currentColor', fontWeight: '600' } }}
                  axisLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: 'currentColor', fontWeight: '500' }}
                  label={{ value: 'Acceptance Rate (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: 'currentColor', fontWeight: '600' } }}
                  axisLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Acceptance Rate') {
                      return [`${value}%`, name];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(year) => `Year: ${year}`}
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontWeight: '500'
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontWeight: '500',
                    fontSize: '13px'
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="accepted"
                  stackId="papers"
                  fill="#ff8c00"
                  name="Number of Accepted"
                  radius={[0, 0, 0, 0]}
                  stroke="#e67300"
                  strokeWidth={1}
                />
                <Bar
                  yAxisId="left"
                  dataKey="rejected"
                  stackId="papers"
                  fill="#1f77b4"
                  name="Number of Rejected"
                  radius={[4, 4, 0, 0]}
                  stroke="#1565c0"
                  strokeWidth={1}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="acceptanceRate"
                  stroke="#ff7f0e"
                  strokeWidth={3}
                  dot={{ fill: '#ff7f0e', strokeWidth: 2, r: 4 }}
                  name="Acceptance Rate"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Stat;
