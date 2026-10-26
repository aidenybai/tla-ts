------------------------------ MODULE Commit ------------------------------
CONSTANT Participants

VARIABLES participantState, coordinatorState, prepared, messages

vars == <<participantState, coordinatorState, prepared, messages>>

Messages == [kind : {"prepared"}, from : Participants] \cup [kind : {"commit", "abort"}]

TypeOK == /\ participantState \in [Participants -> {"working", "prepared", "committed", "aborted"}]
          /\ coordinatorState \in {"init", "done"}
          /\ prepared \subseteq Participants
          /\ messages \subseteq Messages

Init == /\ participantState = [participant \in Participants |-> "working"]
        /\ coordinatorState = "init"
        /\ prepared = {}
        /\ messages = {}

CoordinatorReceive(participant) ==
  /\ coordinatorState = "init"
  /\ [kind |-> "prepared", from |-> participant] \in messages
  /\ prepared' = prepared \cup {participant}
  /\ UNCHANGED <<participantState, coordinatorState, messages>>

CoordinatorCommit ==
  /\ coordinatorState = "init"
  /\ prepared = Participants
  /\ coordinatorState' = "done"
  /\ messages' = messages \cup {[kind |-> "commit"]}
  /\ UNCHANGED <<participantState, prepared>>

CoordinatorAbort ==
  /\ coordinatorState = "init"
  /\ coordinatorState' = "done"
  /\ messages' = messages \cup {[kind |-> "abort"]}
  /\ UNCHANGED <<participantState, prepared>>

Prepare(participant) ==
  /\ participantState[participant] = "working"
  /\ participantState' = [participantState EXCEPT ![participant] = "prepared"]
  /\ messages' = messages \cup {[kind |-> "prepared", from |-> participant]}
  /\ UNCHANGED <<coordinatorState, prepared>>

Decide(participant) ==
  \/ /\ [kind |-> "commit"] \in messages
     /\ participantState' = [participantState EXCEPT ![participant] = "committed"]
     /\ UNCHANGED <<coordinatorState, prepared, messages>>
  \/ /\ [kind |-> "abort"] \in messages
     /\ participantState' = [participantState EXCEPT ![participant] = "aborted"]
     /\ UNCHANGED <<coordinatorState, prepared, messages>>

Next == \/ CoordinatorCommit
        \/ CoordinatorAbort
        \/ \E participant \in Participants :
              CoordinatorReceive(participant) \/ Prepare(participant) \/ Decide(participant)

Spec == Init /\ [][Next]_vars

Consistent ==
  \A first, second \in Participants :
    ~(participantState[first] = "aborted" /\ participantState[second] = "committed")
=============================================================================
