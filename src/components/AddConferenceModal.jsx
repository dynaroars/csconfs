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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Conference</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Conference Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. SIGMOD"
                className={`form-input${errors.name ? ' has-error' : ''}`}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Year *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g. 2028"
                className={`form-input${errors.year ? ' has-error' : ''}`}
              />
              {errors.year && <div className="form-error">{errors.year}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Description *</label>
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. ACM SIGMOD International Conference on Management of Data"
              className={`form-input${errors.description ? ' has-error' : ''}`}
            />
            {errors.description && <div className="form-error">{errors.description}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Official Website Link *</label>
            <input
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="e.g. https://2028.sigmod.org/"
              className={`form-input${errors.link ? ' has-error' : ''}`}
            />
            {errors.link && <div className="form-error">{errors.link}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Conference Dates *</label>
              <input
                name="date"
                value={formData.date}
                onChange={handleChange}
                placeholder="e.g. June 11-16, 2028"
                className={`form-input${errors.date ? ' has-error' : ''}`}
              />
              {errors.date && <div className="form-error">{errors.date}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Location / Place</label>
              <input
                name="place"
                value={formData.place}
                onChange={handleChange}
                placeholder="e.g. Seattle, WA, USA"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Submission Deadline (YYYY-MM-DD)</label>
              <input
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                placeholder="e.g. 2027-11-15"
                className={`form-input${errors.deadline ? ' has-error' : ''}`}
              />
              {errors.deadline && <div className="form-error">{errors.deadline}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Abstract Deadline (YYYY-MM-DD)</label>
              <input
                name="abstract_deadline"
                value={formData.abstract_deadline}
                onChange={handleChange}
                placeholder="e.g. 2027-11-08"
                className={`form-input${errors.abstract_deadline ? ' has-error' : ''}`}
              />
              {errors.abstract_deadline && <div className="form-error">{errors.abstract_deadline}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Notification Date (YYYY-MM-DD)</label>
              <input
                name="notification_date"
                value={formData.notification_date}
                onChange={handleChange}
                placeholder="e.g. 2028-02-15"
                className={`form-input${errors.notification_date ? ' has-error' : ''}`}
              />
              {errors.notification_date && <div className="form-error">{errors.notification_date}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Note / Submission Cycle</label>
              <input
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="e.g. Cycle 1/2"
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Submit to GitHub
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
