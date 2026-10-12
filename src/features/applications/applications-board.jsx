import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Building2, CalendarCheck, CircleX, Grip, MapPin, PartyPopper, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/toast-context";
import ConfirmDialog from "../../components/ui/confirm-dialog";
import ApplicationForm from "./application-form";
import { apiRequest, applicationStatuses, formatDate, statusLabels } from "./api";
import "./applications-board.css";

const stageIcons = {
  Applied: CalendarCheck,
  Interview: Phone,
  Offer: PartyPopper,
  Declined: CircleX,
};

function ApplicationCard({ application, onEdit, onDelete, isDeleting }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application._id,
    data: { status: application.status },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      className={`kanban-card stage-border-${application.status.toLowerCase()}${isDragging ? " is-dragging" : ""}`}
      style={style}
    >
      <div className="kanban-card-heading">
        <div className="kanban-card-title">
          <h3>{application.role}</h3>
          <span>{application.company}</span>
        </div>
        <button
          className="kanban-drag-handle"
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Move ${application.role} at ${application.company}`}
          title="Drag to change status"
        >
          <Grip size={17} />
        </button>
      </div>
      {application.location && (
        <p className="kanban-card-location"><MapPin size={14} />{application.location}</p>
      )}
      {application.notes && <p className="kanban-card-notes">{application.notes}</p>}
      <div className="kanban-card-footer">
        <time dateTime={application.appliedAt}>{formatDate(application.appliedAt)}</time>
        <div className="kanban-card-actions">
          <button type="button" onClick={() => onEdit(application)} aria-label={`Edit ${application.role} at ${application.company}`} title="Edit application">
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => onDelete(application)} disabled={isDeleting} aria-label={`Delete ${application.role} at ${application.company}`} title="Delete application">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function KanbanColumn({ status, applications, onEdit, onDelete, deletingId }) {
  const { isOver, setNodeRef } = useDroppable({ id: `column-${status}`, data: { status } });
  const StageIcon = stageIcons[status];

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column column-${status.toLowerCase()}${isOver ? " is-over" : ""}`}
      aria-label={`${statusLabels[status]} applications`}
    >
      <div className={`kanban-column-heading stage-${status.toLowerCase()}`}>
        <span className="kanban-stage-icon" aria-hidden="true">
          <StageIcon size={17} />
        </span>
        <h2>{statusLabels[status]}</h2>
        <span className="kanban-column-count">{applications.length}</span>
      </div>
      <div className="kanban-card-list">
        {applications.map((application) => (
          <ApplicationCard
            key={application._id}
            application={application}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={deletingId === application._id}
          />
        ))}
        {applications.length === 0 && <p className="kanban-empty-column">Drop an application here</p>}
      </div>
    </section>
  );
}

function ApplicationsBoard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogApplication, setDialogApplication] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    let isMounted = true;
    apiRequest("/api/applications")
      .then((result) => {
        if (isMounted) setApplications(result.applications);
      })
      .catch((error) => {
        if (error.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (isMounted) toast(error.message, "error");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [navigate, toast]);

  const filteredApplications = applications.filter((application) => {
    const searchText = `${application.role} ${application.company} ${application.location || ""}`.toLowerCase();
    return searchText.includes(search.trim().toLowerCase());
  });

  function openNewApplication() {
    setDialogApplication(null);
  }

  function openEditApplication(application) {
    setDialogApplication(application);
  }

  async function saveApplication(form) {
    const isEditing = Boolean(dialogApplication);
    setIsSaving(true);
    try {
      const result = await apiRequest(
        isEditing ? `/api/applications/${dialogApplication._id}` : "/api/applications",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(form),
        },
      );
      setApplications((current) => (
        isEditing
          ? current.map((application) => application._id === result.application._id ? result.application : application)
          : [result.application, ...current]
      ));
      setDialogApplication(undefined);
      toast(isEditing ? "Application updated." : "Application added.", isEditing ? "updated" : "created");
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      toast(error.message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  function requestDeleteApplication(application) {
    setApplicationToDelete(application);
  }

  async function deleteApplication() {
    if (!applicationToDelete) return;
    setDeletingId(applicationToDelete._id);
    try {
      await apiRequest(`/api/applications/${applicationToDelete._id}`, { method: "DELETE" });
      setApplications((current) => current.filter((item) => item._id !== applicationToDelete._id));
      setApplicationToDelete(null);
      toast("Application deleted.", "deleted");
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      toast(error.message, "error");
    } finally {
      setDeletingId("");
    }
  }

  async function moveApplication(application, targetStatus) {
    if (!targetStatus || application.status === targetStatus) return;
    const previousApplications = applications;
    setApplications((current) => current.map((item) => (
      item._id === application._id ? { ...item, status: targetStatus } : item
    )));
    try {
      const result = await apiRequest(`/api/applications/${application._id}`, {
        method: "PUT",
        body: JSON.stringify({
          company: application.company,
          role: application.role,
          location: application.location || "",
          status: targetStatus,
          appliedAt: application.appliedAt,
          notes: application.notes || "",
        }),
      });
      setApplications((current) => current.map((item) => (
        item._id === result.application._id ? result.application : item
      )));
      toast(`Moved to ${statusLabels[targetStatus]}.`, targetStatus.toLowerCase());
    } catch (error) {
      setApplications(previousApplications);
      if (error.status === 401) navigate("/login", { replace: true });
      toast(error.message, "error");
    }
  }

  function finishDrag(event) {
    setActiveId(null);
    const application = applications.find((item) => item._id === event.active.id);
    const targetStatus = event.over?.data.current?.status;
    if (application) moveApplication(application, targetStatus);
  }

  const activeApplication = applications.find((item) => item._id === activeId);
  const dialogOpen = dialogApplication !== undefined;

  return (
    <main className="kanban-page">
      <div className="kanban-page-heading">
        <div>
          <p className="kanban-eyebrow">YOUR JOB SEARCH</p>
          <h1>Application board</h1>
          <p className="kanban-page-copy">Move each opportunity through your hiring pipeline.</p>
        </div>
        <button className="kanban-primary-button" type="button" onClick={() => openNewApplication()}>
          <Plus size={18} /> Add application
        </button>
      </div>

      <div className="kanban-toolbar">
        <label className="kanban-search">
          <Search size={17} aria-hidden="true" />
          <span className="visually-hidden">Search applications</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles or companies" />
        </label>
        <p>{applications.length} {applications.length === 1 ? "application" : "applications"}</p>
      </div>

      {isLoading ? (
        <div className="kanban-loading" role="status">Loading your applications...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          autoScroll={false}
          onDragStart={(event) => setActiveId(event.active.id)}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={finishDrag}
        >
          <div className="kanban-board-scroll">
            <div className="kanban-board">
              {applicationStatuses.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  applications={filteredApplications.filter((application) => application.status === status)}
                  onEdit={openEditApplication}
                  onDelete={requestDeleteApplication}
                  deletingId={deletingId}
                />
              ))}
            </div>
          </div>
          {createPortal(
            <DragOverlay style={{ zIndex: 70 }}>
              {activeApplication && (
                <article className={`kanban-card kanban-card-overlay stage-border-${activeApplication.status.toLowerCase()}`}>
                  <h3>{activeApplication.role}</h3>
                  <span>{activeApplication.company}</span>
                  <p><Building2 size={14} />{statusLabels[activeApplication.status]}</p>
                </article>
              )}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      )}

      {dialogOpen && (
        <ApplicationForm
          key={dialogApplication?._id || "new-application"}
          application={dialogApplication}
          onClose={() => setDialogApplication(undefined)}
          onSave={saveApplication}
          isSaving={isSaving}
        />
      )}
      {applicationToDelete && (
        <ConfirmDialog
          title="Delete application?"
          description={`Delete ${applicationToDelete.role} at ${applicationToDelete.company}? This cannot be undone.`}
          confirmLabel="Delete application"
          variant="danger"
          isConfirming={deletingId === applicationToDelete._id}
          onCancel={() => setApplicationToDelete(null)}
          onConfirm={deleteApplication}
        />
      )}
    </main>
  );
}

export default ApplicationsBoard;
