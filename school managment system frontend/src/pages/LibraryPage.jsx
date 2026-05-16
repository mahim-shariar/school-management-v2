import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { authApi, libraryApi } from "../api";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";

const STATUS_BADGE = {
  Issued: "bg-amber-100 text-amber-700",
  Returned: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-rose-100 text-rose-700",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function LibraryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [tab, setTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const [showBookForm, setShowBookForm] = useState(false);
  const [bookForm, setBookForm] = useState({ title: "", author: "", category: "General", total_copies: 1, shelf_location: "", publish_year: "" });

  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({ book_id: "", borrower_id: "", due_date: "" });

  async function load() {
    try {
      setLoading(true);
      const booksR = await libraryApi.books({ q: search });
      setBooks(booksR.data);
      if (isAdmin) {
        const [issR, studR, teachR] = await Promise.all([
          libraryApi.issues(),
          authApi.users({ role: "student" }),
          authApi.users({ role: "teacher" }),
        ]);
        setIssues(issR.data);
        setBorrowers([...studR.data, ...teachR.data]);
      } else {
        const myR = await libraryApi.myIssues();
        setIssues(myR.data);
      }
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.role]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function addBook(e) {
    e.preventDefault();
    try {
      await libraryApi.addBook({
        ...bookForm,
        total_copies: Number(bookForm.total_copies),
        publish_year: bookForm.publish_year ? Number(bookForm.publish_year) : null,
      });
      setToast({ type: "success", message: "Book added." });
      setShowBookForm(false);
      setBookForm({ title: "", author: "", category: "General", total_copies: 1, shelf_location: "", publish_year: "" });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function removeBook(id) {
    if (!window.confirm("Delete this book?")) return;
    try {
      await libraryApi.removeBook(id);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function issueBook(e) {
    e.preventDefault();
    try {
      await libraryApi.issueBook(issueForm);
      setToast({ type: "success", message: "Book issued." });
      setShowIssueForm(false);
      setIssueForm({ book_id: "", borrower_id: "", due_date: "" });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function returnBook(id) {
    if (!window.confirm("Mark this book as returned?")) return;
    try {
      await libraryApi.returnBook(id);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  return (
    <Sidebar title="Library">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          hero
          gradient="from-teal-500 to-cyan-600"
          title="Library"
          subtitle={isAdmin ? "Manage books and book issuance" : "Browse books and your borrowing history"}
        />

        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-all ${tab === "books" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}
            onClick={() => setTab("books")}
          >
            Books · {books.length}
          </button>
          <button
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-all ${tab === "issues" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}
            onClick={() => setTab("issues")}
          >
            {isAdmin ? "All Issues" : "My Books"} · {issues.length}
          </button>
        </div>

        {tab === "books" && (
          <>
            <div className="mb-4 flex gap-3">
              <input
                type="text"
                placeholder="Search by title or author…"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {isAdmin && (
                <button
                  onClick={() => setShowBookForm((s) => !s)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                >
                  {showBookForm ? "Cancel" : "+ Add Book"}
                </button>
              )}
            </div>

            {showBookForm && isAdmin && (
              <form onSubmit={addBook} className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3">
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder="Title" required value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Author" required value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Category" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} />
                <input type="number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Total copies" min="1" required value={bookForm.total_copies} onChange={(e) => setBookForm({ ...bookForm, total_copies: e.target.value })} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Shelf location" value={bookForm.shelf_location} onChange={(e) => setBookForm({ ...bookForm, shelf_location: e.target.value })} />
                <input type="number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Publish year" value={bookForm.publish_year} onChange={(e) => setBookForm({ ...bookForm, publish_year: e.target.value })} />
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white md:col-span-3">Add Book</button>
              </form>
            )}

            {loading ? (
              <SkeletonList count={3} />
            ) : books.length === 0 ? (
              <EmptyState title="No books" description="Add some books to your library to get started." />
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:hidden">
                  {books.map((b) => (
                    <div key={b.id} className="surface p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold text-slate-900">{b.title}</p>
                          <p className="text-[11px] text-slate-500">by {b.author}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="chip bg-slate-100 text-slate-700">{b.category}</span>
                            {b.shelf_location && <span className="chip bg-amber-100 text-amber-700">🗂 {b.shelf_location}</span>}
                            <span className={`chip ${b.available_copies === 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {b.available_copies}/{b.total_copies} avail
                            </span>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => { setIssueForm({ ...issueForm, book_id: b.id }); setShowIssueForm(true); setTab("issues"); }}
                            disabled={b.available_copies === 0}
                            className="flex-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                          >
                            Issue
                          </button>
                          <button onClick={() => removeBook(b.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden tbl-wrap md:block">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Shelf</th>
                        <th>Available</th>
                        {isAdmin && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                              </div>
                              <span>{b.title}</span>
                            </div>
                          </td>
                          <td>{b.author}</td>
                          <td><span className="chip bg-slate-100 text-slate-700">{b.category}</span></td>
                          <td>{b.shelf_location || "—"}</td>
                          <td>
                            <span className={`chip ${b.available_copies === 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {b.available_copies} / {b.total_copies}
                            </span>
                          </td>
                          {isAdmin && (
                            <td>
                              <div className="flex gap-2">
                                <button onClick={() => { setIssueForm({ ...issueForm, book_id: b.id }); setShowIssueForm(true); setTab("issues"); }} disabled={b.available_copies === 0} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-40">
                                  Issue
                                </button>
                                <button onClick={() => removeBook(b.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {tab === "issues" && (
          <>
            {isAdmin && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowIssueForm((s) => !s)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                >
                  {showIssueForm ? "Cancel" : "+ Issue Book"}
                </button>
              </div>
            )}

            {showIssueForm && isAdmin && (
              <form onSubmit={issueBook} className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3">
                <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required value={issueForm.book_id} onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}>
                  <option value="">— Book —</option>
                  {books.filter((b) => b.available_copies > 0).map((b) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
                <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required value={issueForm.borrower_id} onChange={(e) => setIssueForm({ ...issueForm, borrower_id: e.target.value })}>
                  <option value="">— Borrower —</option>
                  {borrowers.map((b) => (
                    <option key={b.id} value={b.id}>{b.first_name} {b.last_name} ({b.role})</option>
                  ))}
                </select>
                <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required value={issueForm.due_date} onChange={(e) => setIssueForm({ ...issueForm, due_date: e.target.value })} />
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white md:col-span-3">Issue</button>
              </form>
            )}

            {loading ? (
              <SkeletonList count={3} />
            ) : issues.length === 0 ? (
              <EmptyState title="No book issues" description="Books issued to users will appear here." />
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="space-y-2 md:hidden">
                  {issues.map((i) => (
                    <div key={i.id} className="surface p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold text-slate-900">{i.book_title}</p>
                          <p className="text-[11px] text-slate-500">by {i.book_author}</p>
                        </div>
                        <span className={`chip shrink-0 ${STATUS_BADGE[i.status]}`}>{i.status}</span>
                      </div>
                      {isAdmin && (
                        <p className="mt-2 text-xs">
                          <span className="text-slate-500">Borrower: </span>
                          <span className="font-semibold text-slate-700">{i.borrower_name}</span>
                          <span className="ml-1 text-[10px] capitalize text-slate-400">({i.borrower_role})</span>
                        </p>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Issued</p>
                          <p className="mt-0.5 font-semibold text-slate-700">{fmtDate(i.issued_at)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Due</p>
                          <p className="mt-0.5 font-semibold text-slate-700">{fmtDate(i.due_date)}</p>
                        </div>
                      </div>
                      {i.fine > 0 && (
                        <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">Fine: ৳{i.fine}</p>
                      )}
                      {isAdmin && i.status !== "Returned" && (
                        <button onClick={() => returnBook(i.id)} className="mt-2 w-full rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                          Mark Returned
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden tbl-wrap md:block">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Book</th>
                        {isAdmin && <th>Borrower</th>}
                        <th>Issued</th>
                        <th>Due</th>
                        <th>Status</th>
                        <th>Fine</th>
                        {isAdmin && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((i) => (
                        <tr key={i.id}>
                          <td>
                            <div>{i.book_title}</div>
                            <div className="text-xs font-normal text-slate-500">by {i.book_author}</div>
                          </td>
                          {isAdmin && (
                            <td>
                              {i.borrower_name}
                              <div className="text-xs capitalize text-slate-500">{i.borrower_role}</div>
                            </td>
                          )}
                          <td>{fmtDate(i.issued_at)}</td>
                          <td>{fmtDate(i.due_date)}</td>
                          <td><span className={`chip ${STATUS_BADGE[i.status]}`}>{i.status}</span></td>
                          <td>{i.fine > 0 ? <span className="font-semibold text-rose-600">৳{i.fine}</span> : <span className="text-slate-300">—</span>}</td>
                          {isAdmin && (
                            <td>
                              {i.status !== "Returned" && (
                                <button onClick={() => returnBook(i.id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                                  Return
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}
