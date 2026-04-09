export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/2 h-80 md:h-auto bg-gray-200" />
                    <div className="md:w-1/2 p-6 md:p-8">
                        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                        <div className="h-10 bg-gray-200 rounded w-32 mb-6" />
                        <div className="space-y-3 mb-6">
                            <div className="h-4 bg-gray-200 rounded w-40" />
                            <div className="h-4 bg-gray-200 rounded w-36" />
                            <div className="h-4 bg-gray-200 rounded w-28" />
                        </div>
                        <div className="h-20 bg-gray-200 rounded mb-6" />
                        <div className="h-12 bg-gray-200 rounded w-40" />
                    </div>
                </div>
            </div>
            <div className="mt-12">
                <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="h-40 bg-gray-200" />
                            <div className="p-3">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                                <div className="h-5 bg-gray-200 rounded w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}