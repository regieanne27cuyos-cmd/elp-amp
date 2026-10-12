import { useEffect, useState } from "react";

import {

    ArrowLeft,

    BarChart3,

    BookOpen,

    ClipboardList,

    FileText,

    GraduationCap,

    RefreshCw,

    TrendingUp,

    Users,

    UserCheck,

} from "lucide-react";

import SubjectImage from "../subjectImage";

import useClassStudents from "../../hooks/useClassStudents";

import TeacherAttendanceTab from "./teacherAttendanceTab";

import TeacherAssignmentsTab from "./teacherAssignmentsTab";

import TeacherGradebookTab from "./teacherGradebookTab";

import TeacherModulesTab from "./teacherModulesTab";

import TeacherPerformanceOverview from "./teacherPerformanceOverview";





const tabs = [

    {

        key: "overview",

        label: "Overview",

        icon: TrendingUp,

    },

    {

        key: "assignments",

        label: "Assignments",

        icon: ClipboardList,

    },

    {

        key: "attendance",

        label: "Attendance",

        icon: UserCheck,

    },

    {

        key: "modules",

        label: "Modules",

        icon: FileText,

    },

    {

        key: "gradebook",

        label: "Gradebook",

        icon: BarChart3,

    },

];



function ClassInformation({

    classRecord,

    studentCount,

    studentsLoading,

}) {

    const information = [

        {

            label: "Section",

            value:

                classRecord.section?.section_name ||

                "Section unavailable",

            icon: Users,

        },

        {

            label: "Grade level",

            value: `Grade ${classRecord.section?.grade_level || "—"

                }`,

            icon: GraduationCap,

        },

        {

            label: "School year",

            value:

                classRecord.school_year?.name ||

                "School year unavailable",

            icon: BookOpen,

        },

        {

            label: "Students",

            value: studentsLoading

                ? "Loading..."

                : `${studentCount} student${studentCount === 1 ? "" : "s"

                }`,

            icon: Users,

        },

    ];



    return (

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

            {information.map(

                ({ label, value, icon: Icon }) => (

                    <div

                        key={label}

                        className="rounded-xl border border-gray-100 bg-gray-50 p-3"

                    >

                        <div className="flex items-center gap-2 text-xs text-gray-400">

                            <Icon className="h-4 w-4" />

                            {label}

                        </div>



                        <p className="mt-1 text-sm font-medium text-gray-700">

                            {value}

                        </p>

                    </div>

                ),

            )}

        </div>

    );

}



function EmptyTab({

    icon: Icon,

    title,

    description,

    actionLabel,

    onAction,

}) {

    return (

        <div className="flex min-h-[300px] items-center justify-center p-6">

            <div className="max-w-md text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">

                    <Icon className="h-7 w-7 text-blue-600" />

                </div>



                <h2 className="mt-4 text-lg font-bold text-gray-900">

                    {title}

                </h2>



                <p className="mt-2 text-sm leading-6 text-gray-500">

                    {description}

                </p>



                {onAction && (

                    <button

                        type="button"

                        onClick={onAction}

                        className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"

                    >

                        {actionLabel}

                    </button>

                )}

            </div>

        </div>

    );

}



function AssignmentsTab({ onCreateAssignment }) {

    return (

        <EmptyTab

            icon={ClipboardList}

            title="No assignments yet"

            description="Assignments created for this subject and section will appear here."

            actionLabel="Create Assignment"

            onAction={onCreateAssignment}

        />

    );

}



function StudentLoadingState() {

    return (

        <div

            role="status"

            className="flex min-h-[260px] items-center justify-center text-sm text-gray-500"

        >

            Loading students...

        </div>

    );

}



function StudentErrorState({ error, onRetry }) {

    return (

        <div className="p-6">

            <div

                role="alert"

                className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"

            >

                <p>{error}</p>



                <button

                    type="button"

                    onClick={onRetry}

                    className="mt-3 flex items-center gap-2 font-medium hover:underline"

                >

                    <RefreshCw className="h-4 w-4" />

                    Try again

                </button>

            </div>

        </div>

    );

}



function NoStudentsState() {

    return (

        <EmptyTab

            icon={Users}

            title="No students in this section"

            description="Students assigned to this section by the administrator will appear here."

        />

    );

}



function StudentIdentity({ student }) {

    return (

        <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">

                {(student.full_name || "S")

                    .split(/\s+/)

                    .slice(0, 2)

                    .map((part) => part[0])

                    .join("")

                    .toUpperCase()}

            </div>



            <div className="min-w-0">

                <p className="font-medium text-gray-900">

                    {student.full_name || "Unnamed student"}

                </p>



                <p className="truncate text-xs text-gray-400">

                    {student.email || "No email"}

                </p>

            </div>

        </div>

    );

}



function AttendanceTab({

    students,

    loading,

    error,

    onRetry,

    onTakeAttendance,

}) {

    if (loading) return <StudentLoadingState />;



    if (error) {

        return (

            <StudentErrorState

                error={error}

                onRetry={onRetry}

            />

        );

    }



    if (students.length === 0) {

        return <NoStudentsState />;

    }



    return (

        <div className="p-5">

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                <div>

                    <h2 className="font-bold text-gray-900">

                        Section Students

                    </h2>



                    <p className="text-sm text-gray-500">

                        {students.length} active student

                        {students.length === 1 ? "" : "s"} in

                        this section

                    </p>

                </div>



                {onTakeAttendance && (

                    <button

                        type="button"

                        onClick={onTakeAttendance}

                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"

                    >

                        Take Attendance

                    </button>

                )}

            </div>



            <div className="overflow-x-auto rounded-xl border border-gray-100">

                <table className="w-full min-w-[650px] text-sm">

                    <thead>

                        <tr className="bg-gray-50 text-left text-gray-500">

                            <th className="px-4 py-3 font-medium">

                                Student number

                            </th>



                            <th className="px-4 py-3 font-medium">

                                Student

                            </th>



                            <th className="px-4 py-3 font-medium">

                                Account status

                            </th>



                            <th className="px-4 py-3 font-medium">

                                Attendance

                            </th>

                        </tr>

                    </thead>



                    <tbody>

                        {students.map((student) => (

                            <tr

                                key={student.student_id}

                                className="border-t border-gray-100"

                            >

                                <td className="px-4 py-3 text-gray-600">

                                    {student.student_number || "—"}

                                </td>



                                <td className="px-4 py-3">

                                    <StudentIdentity student={student} />

                                </td>



                                <td className="px-4 py-3">

                                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium capitalize text-green-700">

                                        {student.status}

                                    </span>

                                </td>



                                <td className="px-4 py-3 text-gray-400">

                                    No record yet

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}



function GradebookTab({

    students,

    loading,

    error,

    onRetry,

}) {

    if (loading) return <StudentLoadingState />;



    if (error) {

        return (

            <StudentErrorState

                error={error}

                onRetry={onRetry}

            />

        );

    }



    if (students.length === 0) {

        return <NoStudentsState />;

    }



    return (

        <div className="p-5">

            <div className="mb-4">

                <h2 className="font-bold text-gray-900">

                    Class Gradebook

                </h2>



                <p className="text-sm text-gray-500">

                    Students currently assigned to this

                    section

                </p>

            </div>



            <div className="overflow-x-auto rounded-xl border border-gray-100">

                <table className="w-full min-w-[650px] text-sm">

                    <thead>

                        <tr className="bg-gray-50 text-left text-gray-500">

                            <th className="px-4 py-3 font-medium">

                                Student number

                            </th>



                            <th className="px-4 py-3 font-medium">

                                Student

                            </th>



                            <th className="px-4 py-3 font-medium">

                                Recorded scores

                            </th>



                            <th className="px-4 py-3 font-medium">

                                Current grade

                            </th>

                        </tr>

                    </thead>



                    <tbody>

                        {students.map((student) => (

                            <tr

                                key={student.student_id}

                                className="border-t border-gray-100"

                            >

                                <td className="px-4 py-3 text-gray-600">

                                    {student.student_number || "—"}

                                </td>



                                <td className="px-4 py-3">

                                    <StudentIdentity student={student} />

                                </td>



                                <td className="px-4 py-3 text-gray-400">

                                    No scores yet

                                </td>



                                <td className="px-4 py-3">

                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">

                                        Not graded

                                    </span>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>



            <p className="mt-3 text-xs text-gray-400">

                Grades will appear after graded activities

                and score records are added.

            </p>

        </div>

    );

}



export default function TeacherClassWorkspace({

    classRecord,

    onBack,

    onCreateAssignment,

    onTakeAttendance,

}) {



    const [activeTab, setActiveTab] =

        useState("overview");



    const {

        students,

        loading: studentsLoading,

        error: studentsError,

        reload: reloadStudents,

    } = useClassStudents(classRecord.id);



    useEffect(() => {

        setActiveTab("overview");

    }, [classRecord.id]);



    const subjectName =

        classRecord.subject?.subject_name ||

        "Subject unavailable";



    const subjectCode =

        classRecord.subject?.subject_code ||

        "No subject code";



    return (

        <div className="space-y-6">

            <button

                type="button"

                onClick={onBack}

                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"

            >

                <ArrowLeft className="h-4 w-4" />

                Back to My Classes

            </button>



            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">

                    <SubjectImage

                        path={classRecord.subject?.image_path}

                        name={subjectName}

                        className="h-52 w-full lg:h-full"

                    />



                    <div className="p-6">

                        <p className="text-sm font-medium text-blue-600">

                            {subjectCode}

                        </p>



                        <h1 className="mt-1 text-2xl font-bold text-gray-900">

                            {subjectName}

                        </h1>



                        <p className="mt-2 text-sm capitalize text-gray-500">

                            {classRecord.subject?.subject_type ||

                                "Subject"}

                        </p>



                        <div className="mt-6">

                            <ClassInformation

                                classRecord={classRecord}

                                studentCount={students.length}

                                studentsLoading={studentsLoading}

                            />

                        </div>

                    </div>

                </div>

            </section>



            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                <div

                    role="tablist"

                    aria-label={`${subjectName} classroom sections`}

                    className="flex overflow-x-auto border-b border-gray-100"

                >

                    {tabs.map(

                        ({ key, label, icon: Icon }) => {

                            const active = activeTab === key;



                            return (

                                <button

                                    key={key}

                                    id={`${key}-tab`}

                                    type="button"

                                    role="tab"

                                    aria-selected={active}

                                    aria-controls={`${key}-panel`}

                                    onClick={() =>

                                        setActiveTab(key)

                                    }

                                    className={`flex min-w-fit items-center gap-2 border-b-2 px-5 py-4 text-sm font-medium transition-colors ${active

                                        ? "border-blue-600 text-blue-600"

                                        : "border-transparent text-gray-500 hover:text-gray-900"

                                        }`}

                                >

                                    <Icon className="h-4 w-4" />

                                    {label}

                                </button>

                            );

                        },

                    )}

                </div>



                <div

                    id={`${activeTab}-panel`}

                    role="tabpanel"

                    aria-labelledby={`${activeTab}-tab`}

                >

                    {activeTab === "overview" && (

                        <TeacherPerformanceOverview

                            classRecord={classRecord}

                            students={students}

                            studentsLoading={studentsLoading}

                            studentsError={studentsError}

                        />

                    )}

                    {activeTab === "assignments" && (

                        <TeacherAssignmentsTab

                            classRecord={classRecord}

                        />

                    )}



                    {activeTab === "attendance" && (

                        <TeacherAttendanceTab

                            classRecord={classRecord}

                            students={students}

                            studentsLoading={studentsLoading}

                            studentsError={studentsError}

                            onRetryStudents={reloadStudents}

                        />

                    )}



                    {activeTab === "modules" && (

                        <TeacherModulesTab

                            classRecord={classRecord}

                        />

                    )}



                    {activeTab === "gradebook" && (

                        <TeacherGradebookTab

                            classRecord={classRecord}

                            students={students}

                            studentsLoading={studentsLoading}

                            studentsError={studentsError}

                            onRetryStudents={reloadStudents}

                        />

                    )}

                </div>

            </section>

        </div>

    );

}
