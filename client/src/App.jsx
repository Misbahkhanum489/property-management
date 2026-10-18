
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/properties";

const COMPANY_UNIT_LIMITS = {
  company001: 12,
  company002: 10,
  company003: 12,
};

const initialForm = {
  companyId: "company001",
  propertyName: "",
  buildingNumber: "",
  unitNumber: "",
  tenantName: "",
  tenantContact: "",
  annualRent: "",
  status: "Vacant",
};

const navItems = [
  { id: "Dashboard", icon: "▦", label: "Dashboard" },
  { id: "Properties", icon: "⌂", label: "Properties" },
  { id: "Reports", icon: "▤", label: "Reports" },
  { id: "Settings", icon: "⚙", label: "Settings" },
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function normalizedStatus(status) {
  return status === "Maintenance" ? "Occupied" : status || "Vacant";
}

function StatusBadge({ status }) {
  const currentStatus = normalizedStatus(status);

  return (
    <span
      className={`status-badge ${
        currentStatus === "Occupied" ? "occupied" : "vacant"
      }`}
    >
      {currentStatus}
    </span>
  );
}

/*
 * IMPORTANT:
 * UnitForm is outside App so React does not recreate the form
 * component on every keystroke. This prevents the input from
 * losing focus after each character.
 */
function UnitForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  saving,
  isEdit = false,
}) {
  const prefix = isEdit ? "edit" : "new";

  return (
    <section className="content-panel form-panel">
      <div className="form-panel-heading">
        <div className="form-heading-icon">{isEdit ? "✎" : "+"}</div>
        <div>
          <h2>{isEdit ? "Unit Information" : "New Unit Information"}</h2>
          <p>
            {isEdit
              ? "Update the saved details below."
              : "Enter the details for the new property unit."}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="unit-form">
        <div className="form-grid">
          <div className="form-field full-width">
            <label htmlFor={`${prefix}PropertyName`}>Property Name *</label>
            <input
              id={`${prefix}PropertyName`}
              name="propertyName"
              value={values.propertyName}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${prefix}BuildingNumber`}>Building Number</label>
            <input
              id={`${prefix}BuildingNumber`}
              name="buildingNumber"
              value={values.buildingNumber}
              onChange={onChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${prefix}UnitNumber`}>Unit Number *</label>
            <input
              id={`${prefix}UnitNumber`}
              name="unitNumber"
              value={values.unitNumber}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${prefix}TenantName`}>Tenant Name</label>
            <input
              id={`${prefix}TenantName`}
              name="tenantName"
              value={values.tenantName}
              onChange={onChange}
              placeholder="Enter tenant name"
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${prefix}TenantContact`}>Tenant Contact</label>
            <input
              id={`${prefix}TenantContact`}
              name="tenantContact"
              type="tel"
              value={values.tenantContact}
              onChange={onChange}
              placeholder="Enter contact number"
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${prefix}AnnualRent`}>Annual Rent (₹) *</label>
            <input
              id={`${prefix}AnnualRent`}
              name="annualRent"
              type="number"
              min="0"
              step="0.01"
              value={values.annualRent}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${prefix}Status`}>Unit Status *</label>
            <select
              id={`${prefix}Status`}
              name="status"
              value={values.status}
              onChange={onChange}
              required
            >
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
            </select>
          </div>
        </div>

        <div className="form-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Unit"}
          </button>
        </div>
      </form>
    </section>
  );
}

function App() {
  const [page, setPage] = useState("Dashboard");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [newUnitForm, setNewUnitForm] = useState({
    ...initialForm,
  });

  const companyId = form.companyId.trim();
  const unitLimit = COMPANY_UNIT_LIMITS[companyId] ?? null;
  const totalUnits = properties.length;
  const limitReached = unitLimit !== null && totalUnits >= unitLimit;
  const remainingUnits =
    unitLimit === null ? null : Math.max(0, unitLimit - totalUnits);

  const loadProperties = useCallback(async () => {
    if (!companyId) {
      setProperties([]);
      setError("Please enter a company ID in Settings.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}?companyId=${encodeURIComponent(companyId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load properties.");
      }

      setProperties(data.properties || []);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the server. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  const vacantUnits = properties.filter(
    (property) => normalizedStatus(property.status) === "Vacant"
  ).length;

  const occupiedUnits = properties.filter(
    (property) => normalizedStatus(property.status) === "Occupied"
  ).length;

  const totalAnnualRent = properties
    .filter((property) => normalizedStatus(property.status) === "Occupied")
    .reduce(
      (total, property) => total + Number(property.annualRent || 0),
      0
    );

  const filteredProperties = properties.filter((property) => {
    const query = search.toLowerCase();

    return [
      property.propertyName,
      property.buildingNumber,
      property.unitNumber,
      property.tenantName,
      normalizedStatus(property.status),
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleNewUnitChange(event) {
    const { name, value } = event.target;
    setNewUnitForm((previous) => ({ ...previous, [name]: value }));
  }

  function openPage(nextPage) {
    setPage(nextPage);
    setError("");
    setNotice("");

    if (nextPage === "Properties" || nextPage === "Dashboard") {
      loadProperties();
    }
  }

  function openAddUnit() {
    if (limitReached) {
      setError(`Maximum limit of ${unitLimit} units reached.`);
      return;
    }

    setNewUnitForm({
      ...initialForm,
      companyId,
      unitNumber: String(totalUnits + 1),
    });

    setError("");
    setNotice("");
    setPage("AddUnit");
  }

  function openEdit(property) {
    setEditingProperty(property);
    setEditForm({
      propertyName: property.propertyName || "",
      buildingNumber: property.buildingNumber || "",
      unitNumber: String(property.unitNumber || ""),
      tenantName: property.tenantName || "",
      tenantContact: String(property.tenantContact || ""),
      annualRent: String(property.annualRent ?? ""),
      status: normalizedStatus(property.status),
    });

    setError("");
    setNotice("");
    setPage("EditUnit");
  }

  function validateUnitForm(unitForm) {
    if (!unitForm.propertyName.trim() || !unitForm.unitNumber.trim()) {
      return "Property name and unit number are required.";
    }

    if (
      unitForm.annualRent === "" ||
      !Number.isFinite(Number(unitForm.annualRent)) ||
      Number(unitForm.annualRent) < 0
    ) {
      return "Please enter a valid annual rent.";
    }

    if (!["Occupied", "Vacant"].includes(unitForm.status)) {
      return "Choose either Occupied or Vacant.";
    }

    return "";
  }

  async function sendUnitRequest(url, method, unitForm) {
    const payload = {
      companyId,
      propertyName: unitForm.propertyName.trim(),
      buildingNumber: unitForm.buildingNumber.trim(),
      unitNumber: unitForm.unitNumber.trim(),
      tenantName: unitForm.tenantName.trim(),
      tenantContact: unitForm.tenantContact.trim(),
      annualRent: Number(unitForm.annualRent),
      status: unitForm.status,
    };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || `Could not ${method === "POST" ? "add" : "update"} the unit.`
      );
    }

    return data;
  }

  async function handleAddUnitSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (unitLimit !== null && properties.length >= unitLimit) {
      setError(`Maximum limit of ${unitLimit} units reached.`);
      setPage("Properties");
      return;
    }

    const validationError = validateUnitForm(newUnitForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await sendUnitRequest(API_URL, "POST", newUnitForm);

      setNotice("New unit added successfully.");
      setNewUnitForm({ ...initialForm, companyId });
      setPage("Properties");
      await loadProperties();
    } catch (err) {
      setError(err.message || "Something went wrong while adding the unit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!editingProperty || !editForm) return;

    const validationError = validateUnitForm(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await sendUnitRequest(
        `${API_URL}/${encodeURIComponent(editingProperty._id)}`,
        "PUT",
        editForm
      );

      setNotice("Unit details updated successfully.");
      setEditingProperty(null);
      setEditForm(null);
      setPage("Properties");
      await loadProperties();
    } catch (err) {
      setError(err.message || "Something went wrong while updating the unit.");
    } finally {
      setSaving(false);
    }
  }

  function StatCard({ label, value, icon, tone, description }) {
    return (
      <article className={`stat-card ${tone}`}>
        <div className="stat-card-top">
          <span className="stat-icon">{icon}</span>
          <span>{label}</span>
        </div>
        <strong>{value}</strong>
        <small>{description}</small>
      </article>
    );
  }

  function SummaryCards() {
    return (
      <div className="stats-grid">
        <StatCard
          label="Total Units"
          value={totalUnits}
          icon="⌂"
          tone="stat-blue"
          description={
            unitLimit === null
              ? "Registered units"
              : `${totalUnits} of ${unitLimit} units registered`
          }
        />
        <StatCard
          label="Vacant"
          value={vacantUnits}
          icon="◇"
          tone="stat-orange"
          description="Available for tenants"
        />
        <StatCard
          label="Occupied"
          value={occupiedUnits}
          icon="✓"
          tone="stat-green"
          description="Includes previous maintenance units"
        />
      </div>
    );
  }

  function UnitLimitNotice() {
    if (unitLimit === null) {
      return (
        <div className="unit-limit-notice">
          No unit limit is configured for {companyId}.
        </div>
      );
    }

    return (
      <div className={`unit-limit-notice ${limitReached ? "limit-reached" : ""}`}>
        <div>
          <strong>
            {limitReached ? "Maximum capacity reached" : "Unit capacity"}
          </strong>
          <p>
            {totalUnits} of {unitLimit} units registered.
            {limitReached
              ? " You can still edit your existing units."
              : ` ${remainingUnits} ${
                  remainingUnits === 1 ? "unit slot" : "unit slots"
                } remaining.`}
          </p>
        </div>

        <div className="unit-limit-progress">
          <div
            className="unit-limit-progress-fill"
            style={{
              width: `${Math.min(
                100,
                unitLimit ? (totalUnits / unitLimit) * 100 : 0
              )}%`,
            }}
          />
        </div>
      </div>
    );
  }

  function PageHeader({ title, subtitle, action }) {
    return (
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
    );
  }

  function PropertyTable() {
    return (
      <div className="table-wrapper">
        <table className="property-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Property Name</th>
              <th>Building</th>
              <th>Unit Number</th>
              <th>Tenant</th>
              <th>Annual Rent</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  Loading properties...
                </td>
              </tr>
            ) : filteredProperties.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  {search
                    ? "No properties match your search."
                    : "No registered units found."}
                </td>
              </tr>
            ) : (
              filteredProperties.map((property) => {
                const serialNumber =
                  properties.findIndex((item) => item._id === property._id) + 1;

                return (
                  <tr key={property._id}>
                    <td>{serialNumber}</td>
                    <td className="property-name-cell">
                      <span className="property-avatar">
                        {(property.propertyName || "P").charAt(0).toUpperCase()}
                      </span>
                      <span>{property.propertyName}</span>
                    </td>
                    <td>{property.buildingNumber || "—"}</td>
                    <td>{property.unitNumber}</td>
                    <td>{property.tenantName || "—"}</td>
                    <td>{formatCurrency(property.annualRent)}</td>
                    <td>
                      <StatusBadge status={property.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => openEdit(property)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  const refreshButton = (
    <button
      type="button"
      className="secondary-button"
      onClick={loadProperties}
      disabled={loading}
    >
      {loading ? "Refreshing..." : "↻ Refresh"}
    </button>
  );

  const addUnitButton = (
    <button
      type="button"
      className="primary-button"
      onClick={openAddUnit}
      disabled={limitReached || loading || saving}
      title={limitReached ? "Maximum of 12 units reached" : "Add a new unit"}
    >
      + Add New Unit
    </button>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">P</div>
          <div>
            <h2>Propertiq</h2>
            <span>PROPERTY MANAGEMENT</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => openPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {page === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>Need assistance?</strong>
            <p>Manage your properties with ease.</p>
          </div>

          <div className="profile-row">
            <div className="profile-avatar">A</div>
            <div className="profile-info">
              <strong>Administrator</strong>
              <span>Property Manager</span>
            </div>
            <span className="profile-menu">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {page === "EditUnit"
                ? "Edit Unit"
                : page === "AddUnit"
                  ? "Add Unit"
                  : page}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="system-status">
              <span className="online-dot" />
              Property workspace
            </span>
            <div className="topbar-avatar">A</div>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className="alert success-alert">✓ {notice}</div>}
          {error && <div className="alert error-alert">{error}</div>}

          {page === "Dashboard" && (
            <>
              <PageHeader
                title="Dashboard"
                subtitle="Here's an overview of your property portfolio."
                action={refreshButton}
              />

              <UnitLimitNotice />
              <SummaryCards />

              <section className="content-panel dashboard-panel">
                <div className="panel-header">
                  <div>
                    <h2>Property Units</h2>
                    <p>View and edit your registered units</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => openPage("Properties")}
                  >
                    View all units →
                  </button>
                </div>

                <PropertyTable />
              </section>

              <section className="quick-actions">
                <div>
                  <h3>Manage your properties</h3>
                  <p>Add units, edit tenant details, rent, and occupancy status.</p>
                </div>
                <div className="quick-action-buttons">
                  {addUnitButton}
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => openPage("Properties")}
                  >
                    View Properties
                  </button>
                </div>
              </section>
            </>
          )}

          {page === "Properties" && (
            <>
              <PageHeader
                title="Properties"
                subtitle="View, add, and edit your registered property units."
                action={
                  <div className="header-actions">
                    {refreshButton}
                    {addUnitButton}
                  </div>
                }
              />

              <UnitLimitNotice />
              <SummaryCards />

              {limitReached && (
                <div className="alert limit-message">
                  Maximum limit of {unitLimit} units reached. The Add New Unit
                  button is disabled, but you can still edit existing units.
                </div>
              )}

              <section className="content-panel">
                <div className="panel-header property-panel-header">
                  <div>
                    <h2>All Units</h2>
                    <p>{totalUnits} registered units in your portfolio</p>
                  </div>

                  <div className="search-box">
                    <span>⌕</span>
                    <input
                      type="search"
                      placeholder="Search properties or tenants..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                <PropertyTable />
              </section>
            </>
          )}

          {page === "AddUnit" && (
            <>
              <PageHeader
                title="Add New Unit"
                subtitle={`Register another unit. ${remainingUnits} ${
                  remainingUnits === 1 ? "slot" : "slots"
                } remaining.`}
                action={
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => openPage("Properties")}
                  >
                    ← Back to Properties
                  </button>
                }
              />

              <UnitLimitNotice />

              {limitReached ? (
                <div className="alert limit-message">
                  Maximum limit of {unitLimit} units reached. You cannot add
                  another unit.
                </div>
              ) : (
                <UnitForm
                  values={newUnitForm}
                  onChange={handleNewUnitChange}
                  onSubmit={handleAddUnitSubmit}
                  onCancel={() => openPage("Properties")}
                  saving={saving}
                />
              )}
            </>
          )}

          {page === "EditUnit" && editForm && editingProperty && (
            <>
              <PageHeader
                title="Edit Unit"
                subtitle={`Update the details for unit ${editingProperty.unitNumber}.`}
                action={
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => openPage("Properties")}
                  >
                    ← Back to Properties
                  </button>
                }
              />

              <UnitForm
                values={editForm}
                onChange={handleEditChange}
                onSubmit={handleEditSubmit}
                onCancel={() => openPage("Properties")}
                saving={saving}
                isEdit
              />
            </>
          )}

          {page === "Reports" && (
            <>
              <PageHeader
                title="Reports"
                subtitle="A summary of your current property portfolio."
                action={refreshButton}
              />

              <UnitLimitNotice />
              <SummaryCards />

              <section className="content-panel report-panel">
                <div className="panel-header">
                  <div>
                    <h2>Portfolio Summary</h2>
                    <p>Annual rent and unit occupancy overview</p>
                  </div>
                </div>

                <div className="report-grid">
                  <div className="report-item">
                    <span>Annual rent from occupied units</span>
                    <strong>{formatCurrency(totalAnnualRent)}</strong>
                  </div>
                  <div className="report-item">
                    <span>Vacant unit percentage</span>
                    <strong>
                      {totalUnits
                        ? `${Math.round((vacantUnits / totalUnits) * 100)}%`
                        : "0%"}
                    </strong>
                  </div>
                  <div className="report-item">
                    <span>Occupied unit percentage</span>
                    <strong>
                      {totalUnits
                        ? `${Math.round((occupiedUnits / totalUnits) * 100)}%`
                        : "0%"}
                    </strong>
                  </div>
                </div>
              </section>
            </>
          )}

          {page === "Settings" && (
            <>
              <PageHeader
                title="Settings"
                subtitle="Configure the company whose properties you want to view."
              />

              <section className="content-panel settings-panel">
                <div className="form-panel-heading">
                  <div className="form-heading-icon">⚙</div>
                  <div>
                    <h2>Workspace Settings</h2>
                    <p>Set the company ID used for property API requests.</p>
                  </div>
                </div>

                <form
                  className="settings-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setPage("Properties");
                    setNotice("Workspace settings updated.");
                    loadProperties();
                  }}
                >
                  <div className="form-field">
                    <label htmlFor="settingsCompanyId">Company ID</label>
                    <input
                      id="settingsCompanyId"
                      name="companyId"
                      value={form.companyId}
                      onChange={handleChange}
                      required
                    />
                    <small className="field-help">
                      {COMPANY_UNIT_LIMITS[form.companyId.trim()] !== undefined
                      ? `This company can register a maximum of ${COMPANY_UNIT_LIMITS[form.companyId.trim()]} units.`
                      : "No unit limit is configured for this company."}
                    </small>
                  </div>

                  <button type="submit" className="primary-button">
                    Save Settings
                  </button>
                </form>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
