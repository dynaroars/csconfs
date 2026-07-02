import React, { useState } from 'react';

export default function AddConferenceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear() + 1,
    description: '',
    link: '',
    date: '',
    place: '',
    deadline: '',
    abstract_deadline: '',
    notification_date: '',
    note: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Conference name is required';
    if (!formData.year || isNaN(formData.year)) newErrors.year = 'A valid year is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    if (!formData.link.trim()) {
      newErrors.link = 'Official link is required';
    } else if (!/^https?:\/\/.+/.test(formData.link)) {
      newErrors.link = 'Must be a valid URL starting with http:// or https://';
    }

    if (!formData.date.trim()) newErrors.date = 'Conference dates are required';

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (formData.deadline && !datePattern.test(formData.deadline)) {
      newErrors.deadline = 'Must be in YYYY-MM-DD format';
    }
    if (formData.abstract_deadline && !datePattern.test(formData.abstract_deadline)) {
      newErrors.abstract_deadline = 'Must be in YYYY-MM-DD format';
    }
    if (formData.notification_date && !datePattern.test(formData.notification_date)) {
      newErrors.notification_date = 'Must be in YYYY-MM-DD format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Build the YAML snippet
    const yamlLines = [];
    yamlLines.push(`- name: ${formData.name.trim()}`);
    yamlLines.push(`  year: ${parseInt(formData.year, 10)}`);
    yamlLines.push(`  description: ${formData.description.trim()}`);
    yamlLines.push(`  link: ${formData.link.trim()}`);
    yamlLines.push(`  date: ${formData.date.trim()}`);
    yamlLines.push(`  place: ${formData.place.trim() ? formData.place.trim() : 'null'}`);
    yamlLines.push(`  deadline: ${formData.deadline.trim() ? `'${formData.deadline.trim()}'` : 'null'}`);
    yamlLines.push(`  abstract_deadline: ${formData.abstract_deadline.trim() ? `'${formData.abstract_deadline.trim()}'` : 'null'}`);
    yamlLines.push(`  notification_date: ${formData.notification_date.trim() ? `'${formData.notification_date.trim()}'` : 'null'}`);
    yamlLines.push(`  note: ${formData.note.trim() ? formData.note.trim() : 'null'}`);

    const yamlBlock = yamlLines.join('\n');

    // Build issue body
    const issueBody = `### New Conference Submission

Please review and merge the following conference details to the database:

\`\`\`yaml
${yamlBlock}
\`\`\`

*This submission was created using the Add Conference tool on the CSConfs website.*`;

    const repoUrl = 'https://github.com/dynaroars/csconfs';
    const title = `[ADD-CONFERENCE] ${formData.name.trim()} ${formData.year}`;
    const labels = 'add-conference';
    const githubUrl = `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(issueBody)}&labels=${encodeURIComponent(labels)}`;

    window.open(githubUrl, '_blank', 'noopener,noreferrer');
    
    onClose();
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px',
  };

  const modalStyle = {
    background: 'var(--bg-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-color)',
  };

  const titleStyle = {
    margin: 0,
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '24px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  };

  const formStyle = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  };

  const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const labelStyle = {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  };

  const inputStyle = (hasError) => ({
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${hasError ? '#d32f2f' : 'var(--border-color)'}`,
    background: 'var(--bg-color)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  });

  const errorStyle = {
    color: '#d32f2f',
    fontSize: '12px',
    marginTop: '2px',
  };

  const submitButtonStyle = {
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    background: '#2ca02c',
    color: 'white',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: '8px',
  };

  const cancelButtonStyle = {
    padding: '10px 16px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: '8px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Add New Conference</h2>
          <button style={closeButtonStyle} onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Conference Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. SIGMOD"
                style={inputStyle(errors.name)}
              />
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Year *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g. 2028"
                style={inputStyle(errors.year)}
              />
              {errors.year && <div style={errorStyle}>{errors.year}</div>}
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Full Description *</label>
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. ACM SIGMOD International Conference on Management of Data"
              style={inputStyle(errors.description)}
            />
            {errors.description && <div style={errorStyle}>{errors.description}</div>}
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Official Website Link *</label>
            <input
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="e.g. https://2028.sigmod.org/"
              style={inputStyle(errors.link)}
            />
            {errors.link && <div style={errorStyle}>{errors.link}</div>}
          </div>

          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Conference Dates *</label>
              <input
                name="date"
                value={formData.date}
                onChange={handleChange}
                placeholder="e.g. June 11-16, 2028"
                style={inputStyle(errors.date)}
              />
              {errors.date && <div style={errorStyle}>{errors.date}</div>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Location / Place</label>
              <input
                name="place"
                value={formData.place}
                onChange={handleChange}
                placeholder="e.g. Seattle, WA, USA"
                style={inputStyle(false)}
              />
            </div>
          </div>

          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Submission Deadline (YYYY-MM-DD)</label>
              <input
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                placeholder="e.g. 2027-11-15"
                style={inputStyle(errors.deadline)}
              />
              {errors.deadline && <div style={errorStyle}>{errors.deadline}</div>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Abstract Deadline (YYYY-MM-DD)</label>
              <input
                name="abstract_deadline"
                value={formData.abstract_deadline}
                onChange={handleChange}
                placeholder="e.g. 2027-11-08"
                style={inputStyle(errors.abstract_deadline)}
              />
              {errors.abstract_deadline && <div style={errorStyle}>{errors.abstract_deadline}</div>}
            </div>
          </div>

          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Notification Date (YYYY-MM-DD)</label>
              <input
                name="notification_date"
                value={formData.notification_date}
                onChange={handleChange}
                placeholder="e.g. 2028-02-15"
                style={inputStyle(errors.notification_date)}
              />
              {errors.notification_date && <div style={errorStyle}>{errors.notification_date}</div>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Note / Submission Cycle</label>
              <input
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="e.g. Cycle 1/2"
                style={inputStyle(false)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" style={cancelButtonStyle} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={submitButtonStyle}>
              Submit to GitHub
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
