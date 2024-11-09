"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { Calendar, momentLocalizer, Views, type View, type Event, type SlotInfo } from 'react-big-calendar'
import moment from 'moment'
import "react-big-calendar/lib/css/react-big-calendar.css"
import { getEvents, getColleges, getEvent, type Event as FireBaseEvent } from '@/lib/db'
import {addEventHandler, deleteEventHandler, updateEventHandler} from "@/app/events/actions"
import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

const localizer = momentLocalizer(moment)

type College = {
    created_at: number,
    delete_at: number | null,
    id: string,
    name: string,
    updated_at: number | null
}

export function EventsPage({isAdmin}: {isAdmin: boolean}){
    const [pageKey, setPageKey] = useState(0);
    const [view, setView] = useState<View | undefined>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    //const [events, setEvents] = useState<Event[]>();
    const [colleges, setColleges] = useState<College[]>();

    const [addOpen, setAddOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();

    const [viewOpen, setViewOpen] = useState(false);
    const [eventName, setEventName] = useState("")
    const [selectedEvent, setSelectedEvent] = useState<FireBaseEvent | null>(null);

    const router = useRouter();

    const events = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const firebaseEvents = await getEvents() as {
                id: string,
                college_id: string,
                datetime: string,
                url: string,
                name: string,
                type: string
            }[];

            const eventsList = []
            for(let event of firebaseEvents){
                eventsList.push({
                    title: event.name,
                    start: new Date(event.datetime),
                    end: new Date(event.datetime)
                })
            }
            return eventsList
        },
        refetchInterval: 1500
    })

    useEffect(() => {
        setPageKey(pageKey+1);

        const getCollegesList = async () => {
            setColleges(await getColleges() as College[]);
        }
        getCollegesList()
    }, [])

    useEffect(() => {
        const getEventsAction = async () => {
            const firebaseEvents = await getEvents() as {
                id: string,
                college_id: string,
                datetime: string,
                url: string,
                name: string,
                type: string
            }[];

            const eventsList = []
            for(let event of firebaseEvents){
                eventsList.push({
                    title: event.name,
                    start: new Date(event.datetime),
                    end: new Date(event.datetime)
                })
            }
            //setEvents(eventsList)
        }

        const getCollegesList = async () => {
            setColleges(await getColleges() as College[]);
        }

        if(!addOpen){
            getCollegesList();
            //getEventsAction();   
        }
    }, [addOpen]);

    useEffect(() => {
        if(viewOpen){
            (async () => {
                setSelectedEvent(await getEvent(eventName))
            })()
        }
    }, [viewOpen, eventName])

    const selectSlotHandler = (info: SlotInfo) => {
        setAddOpen(true);
        setSelectedDate(info.end);
    }

    const selectEventHandler = (event: Event) => {
        setViewOpen(true);
        setEventName(event.title as string)
    }

    const deleteEvent = (id: string) => {
        deleteEventHandler(id);
        setViewOpen(false);
    }

    return (
        <main className='flex flex-col h-full'>
            <div className='h-full p-6'>
            <Calendar
                key={pageKey}
                localizer={localizer}
                startAccessor="start"
                endAccessor="end"
                defaultView={view}
                events={events.data!}
                view={view} // Include the view prop
                date={date} // Include the date prop
                onView={(view: View): void => setView(view)}
                onSelectSlot={(info: SlotInfo) => selectSlotHandler(info)}
                onSelectEvent={(event: Event) => selectEventHandler(event)}
                selectable
                onNavigate={(date) => {
                    setDate(new Date(date));
                }}
            />
            </div>
            <Dialog open={addOpen && isAdmin} onOpenChange={(open) => setAddOpen(open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add an event</DialogTitle>
                    </DialogHeader>
                    <form method="POST" action={addEventHandler} onSubmit={() => {
                        setAddOpen(false);
                        router.refresh();
                    }} className="flex flex-col gap-3">
                        <Label>Name</Label>
                        <Input name="name" placeholder="Event name" required/>
                        <Label>Type</Label>
                        <Input name="type" placeholder="Event type" required/>
                        <Label>Date & Time</Label>
                        <Input type="date" name="datetime" defaultValue={selectedDate?.toISOString().substring(0,10)} required/>
                        <Label>College</Label>
                        <Select name="college">
                            <SelectTrigger>
                                <SelectValue placeholder="Select your college"/>
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    colleges?.map((college) => (
                                        <SelectItem value={college.id} key={college.id}>{college.name}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                        <Label>Event URL</Label>
                        <Input type="url" name="url" placeholder="https://example.com"/>
                        <div>
                            <Button type="submit">Add event</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={viewOpen} onOpenChange={(open) => {
                if(!open){
                    setSelectedEvent(null)
                }
                setViewOpen(open)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Event</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={() => {
                        setViewOpen(false);
                        router.refresh();
                    }} action={updateEventHandler} className="flex flex-col gap-3">
                        <input name="id" value={selectedEvent?.id!} className="hidden"/>
                        <Label>Name</Label>
                        <Input name="name" placeholder="Event name" className="disabled:opacity-100" defaultValue={selectedEvent?.name as string} disabled={!isAdmin} required/>
                        <Label>Type</Label>
                        <Input name="type" placeholder="Event type" className="disabled:opacity-100" defaultValue={selectedEvent?.type} disabled={!isAdmin} required/>
                        <Label>Date & Time</Label>
                        <Input type="date" name="datetime" className="disabled:opacity-100" defaultValue={selectedEvent?.datetime} disabled={!isAdmin} required/>
                        <Label>College</Label>
                        <Select name="college" defaultValue={selectedEvent?.college_id as string} disabled={!isAdmin} key={selectedEvent?.id as string}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your college"/>
                            </SelectTrigger>
                            <SelectContent className="disabled:opacity-100">
                                {
                                    colleges?.map((college) => (
                                        <SelectItem value={college.id} key={college.id}>{college.name}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                        <Label>Event URL</Label>
                        <Input type="url" name="url" placeholder="https://example.com" defaultValue={selectedEvent?.url!} disabled={!isAdmin}/>
                        <div className="flex flex-row gap-2">
                            {
                                isAdmin && <Button type="submit">Update event</Button>
                            }
                            {
                                isAdmin && <Button variant="destructive" type="button" onClick={() => deleteEvent(selectedEvent?.id!)}>Delete event</Button>
                            }
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}