----------------------------- MODULE Liveness -----------------------------
EXTENDS Naturals

CONSTANTS Processes, Limit

VARIABLES count, location, token

vars == <<count, location, token>>

Init == /\ count = 0
        /\ location = [process \in Processes |-> "idle"]
        /\ token \in Processes

Increment == /\ count < Limit
             /\ count' = count + 1
             /\ UNCHANGED <<location, token>>

Request(process) == /\ location[process] = "idle"
                    /\ location' = [location EXCEPT ![process] = "waiting"]
                    /\ UNCHANGED <<count, token>>

Enter(process) == /\ location[process] = "waiting"
                  /\ token = process
                  /\ location' = [location EXCEPT ![process] = "critical"]
                  /\ UNCHANGED <<count, token>>

Leave(process) == /\ location[process] = "critical"
                  /\ location' = [location EXCEPT ![process] = "idle"]
                  /\ token' \in Processes \ {process}
                  /\ UNCHANGED count

Pass(process) == /\ token = process
                 /\ location[process] = "idle"
                 /\ token' \in Processes \ {process}
                 /\ UNCHANGED <<count, location>>

Step(process) == Request(process) \/ Enter(process) \/ Leave(process) \/ Pass(process)

Next == Increment \/ \E process \in Processes : Step(process)

Unfair == Init /\ [][Next]_vars

Fair == Unfair /\ WF_vars(Increment) /\ \A process \in Processes : WF_vars(Step(process))

Strong == Unfair /\ WF_vars(Increment) /\ \A process \in Processes : SF_vars(Enter(process)) /\ WF_vars(Step(process))

ReachesLimit == <>(count = Limit)

StaysAtLimit == <>[](count = Limit)

Served == \A process \in Processes : location[process] = "waiting" ~> location[process] = "critical"


TokenMoves == []<><<\E process \in Processes : Pass(process) \/ Leave(process)>>_token

NeverCritical == <>(\A process \in Processes : location[process] = "critical")
=============================================================================
