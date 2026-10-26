------------------------------ MODULE Mutex ------------------------------
EXTENDS Naturals

Processes == {0, 1}

Other(process) == 1 - process

VARIABLES wants, turn, location

vars == <<wants, turn, location>>

TypeOK == /\ wants \in [Processes -> BOOLEAN]
          /\ turn \in Processes
          /\ location \in [Processes -> {"idle", "waiting", "critical"}]

Init == /\ wants = [process \in Processes |-> FALSE]
        /\ turn \in Processes
        /\ location = [process \in Processes |-> "idle"]

Request(process) ==
  /\ location[process] = "idle"
  /\ wants' = [wants EXCEPT ![process] = TRUE]
  /\ turn' = Other(process)
  /\ location' = [location EXCEPT ![process] = "waiting"]

Enter(process) ==
  /\ location[process] = "waiting"
  /\ \/ ~wants[Other(process)]
     \/ turn = process
  /\ location' = [location EXCEPT ![process] = "critical"]
  /\ UNCHANGED <<wants, turn>>

Exit(process) ==
  /\ location[process] = "critical"
  /\ wants' = [wants EXCEPT ![process] = FALSE]
  /\ location' = [location EXCEPT ![process] = "idle"]
  /\ UNCHANGED turn

Next == \E process \in Processes : Request(process) \/ Enter(process) \/ Exit(process)

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

MutualExclusion == ~(location[0] = "critical" /\ location[1] = "critical")

TurnStaysValid == [][turn' \in Processes]_vars
=============================================================================
