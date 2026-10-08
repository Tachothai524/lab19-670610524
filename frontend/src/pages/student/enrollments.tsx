import { useState } from "react";
import { PlusCircle, ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/auth-store";
import { useEnrollmentStore } from "@/lib/enrollment-store";
import { ConfirmDeleteButton } from "@/components/confirm-button";
import type { Enrollment } from "@/lib/types";

export default function StudentEnrollmentsPage() {
  const studentId = useAuthStore((s) => s.studentId);
  const {
    students,
    courses,
    enrollments,
    enroll,
    dropEnrollment,
    updateEnrollment,
  } = useEnrollmentStore();

  const [open, setOpen] = useState(false);
  const [formCourse, setFormCourse] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [courseold, setcourseold] = useState<string | null>(null);
  const [newCourseId, setNewCourseId] = useState<string | null>(null);
  const [openupdate, setOpenupdate] = useState(false);

  const me = students.find((s) => s.studentId === studentId);
  const myEnrollments = enrollments.filter((e) => e.studentId === studentId);

  const courseOptions = courses
    .filter((c) => !myEnrollments.some((e) => e.courseId === c.courseId))
    .map((c) => ({
      value: c.courseId,
      label: `${c.courseId} — ${c.courseTitle}`,
    }));

  // const course1 = courses.map((c) => ({
  //   value: c.courseId,
  //   label: `${c.courseId} — ${c.courseTitle}`,
  // }));

  const courseOf = (courseId: string) =>
    courses.find((c) => c.courseId === courseId);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setFormCourse(null);
      setServerError(null);
    }
  };

  const handleEnroll = async () => {
    if (!studentId || !formCourse) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await enroll(studentId, formCourse);
      handleOpenChange(false);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleputChange = (next: boolean) => {
    setOpenupdate(next);
    if (!next) {
      setNewCourseId(null);
      setServerError(null);
    }
  };

  const handleputEnroll = async () => {
    if (!studentId || !courseold || !newCourseId) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await updateEnrollment(studentId, courseold, newCourseId);
      setOpenupdate(false);
      handleputChange(false);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (enrollment: Enrollment) => {
    setDeleteError(null);
    try {
      await dropEnrollment(enrollment);
    } catch (err) {
      setDeleteError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">จัดการการลงทะเบียน</h1>
          <p className="text-sm text-muted-foreground">
            {me
              ? `${me.studentId} — ${me.firstName} ${me.lastName} (${me.program})`
              : (studentId ?? "-")}{" "}
            · ลงทะเบียนแล้ว {myEnrollments.length} วิชา
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button disabled={!studentId} />}>
            <PlusCircle className="h-4 w-4" />
            ลงทะเบียนเรียน
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>ลงทะเบียนเรียน</DialogTitle>
              <DialogDescription>
                เลือกวิชาที่ยังไม่ได้ลงทะเบียน
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="formCourse">วิชา</Label>
              <Select
                items={courseOptions}
                value={formCourse}
                onValueChange={(v) => setFormCourse(v as string)}
              >
                <SelectTrigger id="formCourse" className="w-full">
                  <SelectValue
                    placeholder={
                      courseOptions.length === 0
                        ? "ลงทะเบียนครบทุกวิชาแล้ว"
                        : "เลือกวิชา"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <DialogFooter>
              <Button
                disabled={!formCourse || submitting}
                onClick={handleEnroll}
              >
                <PlusCircle className="h-4 w-4" />
                {submitting ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {deleteError && (
        <p className="text-sm text-destructive">
          ยกเลิกไม่สำเร็จ: {deleteError}
        </p>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัสวิชา</TableHead>
              <TableHead>ชื่อวิชา</TableHead>
              <TableHead>ผู้สอน</TableHead>
              <TableHead>วันที่ลงทะเบียน</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myEnrollments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-20 text-center text-muted-foreground"
                >
                  ยังไม่ได้ลงทะเบียนวิชาใด
                </TableCell>
              </TableRow>
            )}
            {myEnrollments.map((e) => {
              const course = courseOf(e.courseId);
              return (
                <TableRow key={e.courseId}>
                  <TableCell>{e.courseId}</TableCell>
                  <TableCell>{course?.courseTitle ?? "-"}</TableCell>
                  <TableCell>{course?.instructors.join(", ") || "-"}</TableCell>
                  <TableCell>
                    {e.enrolledAt
                      ? new Date(e.enrolledAt).toLocaleString("th-TH")
                      : "-"}
                  </TableCell>
                  <TableCell className="p-2 align-middle">
                    <Dialog open={openupdate} onOpenChange={handleputChange}>
                      <DialogTrigger
                        render={
                          <Button
                            disabled={!studentId}
                            variant="ghost"
                            size="icon"
                            onClick={() => setcourseold(e.courseId)}
                          />
                        }
                      >
                        <ArrowLeftRight />
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>{`เปลี่ยนวิชา ${courseold}`}</DialogTitle>
                          <DialogDescription>
                            {`เลือกวิชาใหม่แทนวิชา ${courseold} (เลือกได้เฉพาะวิชาที่ยังไม่ได้ลงทะเบียน)`}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-1.5">
                          <Label htmlFor="newCourseId">วิชาใหม่</Label>
                          <Select
                            items={courseOptions}
                            value={newCourseId}
                            onValueChange={(v) => setNewCourseId(v as string)}
                          >
                            <SelectTrigger id="newCourseId" className="w-full">
                              <SelectValue
                                placeholder={
                                  courseOptions.length === 0
                                    ? "ไม่มีวิชาให้เลือก"
                                    : "เลือกวิชา"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {courseOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {serverError && (
                          <p className="text-sm text-destructive">
                            {serverError}
                          </p>
                        )}
                        <DialogFooter>
                          <Button
                            disabled={!newCourseId || submitting}
                            onClick={handleputEnroll}
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                            {submitting ? "กำลังบันทึก..." : "บันทึก"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <ConfirmDeleteButton
                      label={`ลบวิชา ${course?.courseId}`}
                      title={`ยกเลิกการลงทะเบียนวิชา ${course?.courseId}?`}
                      description={`${course?.courseTitle}`}
                      onConfirm={() => handleDelete(e)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
