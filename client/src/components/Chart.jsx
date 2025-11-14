import PropTypes from 'prop-types';
import './Chart.css';

/**
 * Simple bar chart component without external dependencies
 */
const BarChart = ({ data, title, color = 'var(--primary)' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="bar-chart">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

          return (
            <div key={index} className="bar-item">
              <div className="bar-wrapper">
                <div
                  className="bar"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: color
                  }}
                >
                  <span className="bar-value">{item.value}</span>
                </div>
              </div>
              <div className="bar-label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Simple line chart component
 */
const LineChart = ({ data, title, color = 'var(--primary)' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (((item.value - minValue) / range) * 80 + 10);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="line-chart">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (((item.value - minValue) / range) * 80 + 10);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <div className="line-chart-labels">
          {data.map((item, index) => (
            <div key={index} className="line-label">
              <span className="label-text">{item.label}</span>
              <span className="label-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Simple progress/gauge chart
 */
const ProgressChart = ({ value, max, label, color = 'var(--success)' }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="progress-chart">
      <div className="progress-info">
        <span className="progress-label">{label}</span>
        <span className="progress-value">{value} / {max}</span>
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        >
          <span className="progress-percentage">{Math.round(percentage)}%</span>
        </div>
      </div>
    </div>
  );
};

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired
    })
  ).isRequired,
  title: PropTypes.string,
  color: PropTypes.string
};

LineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired
    })
  ).isRequired,
  title: PropTypes.string,
  color: PropTypes.string
};

ProgressChart.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string
};

export { BarChart, LineChart, ProgressChart };
