"use client";

import { useState, useEffect } from "react";
import { Book, Plus, Search, User, Calendar, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { format } from "date-fns";
import LibraryRoster from "@/components/library/LibraryRoster";

interface BookType {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    coverUrl?: string;
    totalCopies: number;
    available: number;
    location?: string;
}

interface LoanType {
    id: string;
    book: BookType;
    youthName: string;
    loanedBy: string;
    loanDate: string;
    status: "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST";
    startTime?: string;
    endTime?: string;
    group?: { name: string };
}

export default function LibraryPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"books" | "loans" | "planning">("planning");
    const [books, setBooks] = useState<BookType[]>([]);
    const [loans, setLoans] = useState<LoanType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [showAddBook, setShowAddBook] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState<BookType | null>(null);

    // Forms
    const [bookForm, setBookForm] = useState({ title: "", author: "", isbn: "", totalCopies: 1, location: "" });
    const [loanForm, setLoanForm] = useState({ youthName: "", notes: "" });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "books") {
                const res = await fetch("/api/library/books");
                const data = await res.json();
                setBooks(data);
            } else {
                const res = await fetch("/api/library/loans");
                const data = await res.json();
                setLoans(data);
                // Also fetch books if in planning mode to populate dropdown
                if (activeTab === "planning") {
                    const booksRes = await fetch("/api/library/books");
                    const booksData = await booksRes.json();
                    setBooks(booksData);
                }
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBook = async () => {
        try {
            await fetch("/api/library/books", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookForm),
            });
            setShowAddBook(false);
            setBookForm({ title: "", author: "", isbn: "", totalCopies: 1, location: "" });
            fetchData();
        } catch (error) {
            console.error("Error adding book", error);
        }
    };

    const handleLoanBook = async () => {
        if (!showLoanModal) return;
        try {
            await fetch("/api/library/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookId: showLoanModal.id,
                    youthName: loanForm.youthName,
                    loanedBy: user?.id || "unknown",
                    notes: loanForm.notes
                }),
            });
            setShowLoanModal(null);
            setLoanForm({ youthName: "", notes: "" });
            fetchData(); // Refresh books to update availability
        } catch (error) {
            console.error("Error loaning book", error);
        }
    };

    const handleAddPlanningLoan = async (loanData: any) => {
        try {
            await fetch("/api/library/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...loanData,
                    loanedBy: user?.id || "unknown",
                }),
            });
            fetchData();
        } catch (error) {
            console.error("Error creating planning loan", error);
        }
    };

    const handleReturnBook = async (loanId: string) => {
        if (!confirm("Bevestig inname van dit boek?")) return;
        try {
            await fetch(`/api/library/loans?id=${loanId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "RETURNED" }),
            });
            fetchData();
        } catch (error) {
            console.error("Error returning book", error);
        }
    };

    const filteredBooks = books.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-serif">Bibliotheek</h1>
                    <p className="text-gray-500 mt-1">Beheer boeken en uitleningen</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab("books")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "books" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Boeken
                        </button>
                        <button
                            onClick={() => setActiveTab("loans")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "loans" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Uitleningen
                        </button>
                        <button
                            onClick={() => setActiveTab("planning")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "planning" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Planning
                        </button>
                    </div>
                    {activeTab === "books" && (
                        <button
                            onClick={() => setShowAddBook(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md"
                        >
                            <Plus size={20} />
                            Nieuw Boek
                        </button>
                    )}
                </div>
            </div>

            {activeTab === "books" && (
                <>
                    <div className="mb-6 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Zoek op titel of auteur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredBooks.map(book => (
                            <div key={book.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="h-32 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                                    <BookOpen size={48} className="text-blue-200" />
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{book.title}</h3>
                                    <p className="text-gray-500 text-sm mb-4">{book.author}</p>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="text-sm">
                                            <span className={`font-bold ${book.available > 0 ? "text-green-600" : "text-red-600"}`}>
                                                {book.available}
                                            </span>
                                            <span className="text-gray-400"> / {book.totalCopies} beschikbaar</span>
                                        </div>
                                        <button
                                            onClick={() => setShowLoanModal(book)}
                                            disabled={book.available === 0}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Lenen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === "loans" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Boek</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Geleend door</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Datum</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loans.map(loan => (
                                <tr key={loan.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{loan.book.title}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {loan.group ? loan.group.name : loan.youthName}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {format(new Date(loan.loanDate), "d MMM yyyy")}
                                        {loan.startTime && (
                                            <span className="block text-xs text-gray-400">
                                                {format(new Date(loan.startTime), "HH:mm")} - {loan.endTime ? format(new Date(loan.endTime), "HH:mm") : ""}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${loan.status === "ACTIVE" ? "bg-blue-100 text-blue-700" :
                                            loan.status === "RETURNED" ? "bg-green-100 text-green-700" :
                                                "bg-red-100 text-red-700"
                                            }`}>
                                            {loan.status === "ACTIVE" ? "Uitgeleend" :
                                                loan.status === "RETURNED" ? "Ingeleverd" : loan.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {loan.status === "ACTIVE" && (
                                            <button
                                                onClick={() => handleReturnBook(loan.id)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Innemen
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}



            {activeTab === "planning" && (
                <LibraryRoster
                    loans={loans}
                    books={books}
                    onAddLoan={handleAddPlanningLoan}
                />
            )}

            {/* Add Book Modal */}
            {showAddBook && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">Nieuw Boek Toevoegen</h2>
                        <div className="space-y-4">
                            <input
                                className="w-full p-2.5 border border-gray-200 rounded-xl"
                                placeholder="Titel"
                                value={bookForm.title}
                                onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                            />
                            <input
                                className="w-full p-2.5 border border-gray-200 rounded-xl"
                                placeholder="Auteur"
                                value={bookForm.author}
                                onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                            />
                            <input
                                className="w-full p-2.5 border border-gray-200 rounded-xl"
                                placeholder="ISBN (optioneel)"
                                value={bookForm.isbn}
                                onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })}
                            />
                            <input
                                type="number"
                                className="w-full p-2.5 border border-gray-200 rounded-xl"
                                placeholder="Aantal exemplaren"
                                value={bookForm.totalCopies}
                                onChange={e => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) })}
                            />
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setShowAddBook(false)} className="px-4 py-2 text-gray-600">Annuleren</button>
                                <button onClick={handleAddBook} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Toevoegen</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loan Modal */}
            {showLoanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-2">Boek Uitlenen</h2>
                        <p className="text-gray-500 mb-6">"{showLoanModal.title}" uitlenen aan:</p>
                        <div className="space-y-4">
                            <input
                                className="w-full p-2.5 border border-gray-200 rounded-xl"
                                placeholder="Naam Jongere / Groep"
                                value={loanForm.youthName}
                                onChange={e => setLoanForm({ ...loanForm, youthName: e.target.value })}
                            />
                            <textarea
                                className="w-full p-2.5 border border-gray-200 rounded-xl"
                                placeholder="Opmerkingen (optioneel)"
                                value={loanForm.notes}
                                onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setShowLoanModal(null)} className="px-4 py-2 text-gray-600">Annuleren</button>
                                <button onClick={handleLoanBook} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Uitlenen</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
