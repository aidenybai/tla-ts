---- MODULE OptionValues ----
EXTENDS Naturals
CONSTANT Nil
VARIABLES acked, turn
Values == {1, 2}
First == CHOOSE value \in {acked[1], acked[2]} : TRUE
Init == acked = [v \in Values |-> IF v = 1 THEN Nil ELSE FALSE] /\ turn = 0
Pick ==
  /\ turn < 3
  /\ First = Nil
  /\ turn' = turn + 1
  /\ acked' = [acked EXCEPT ![2] = IF acked[2] = Nil THEN FALSE ELSE ~acked[2]]
Ack(v) ==
  /\ acked[v] = Nil
  /\ acked' = [acked EXCEPT ![v] = turn > 0]
  /\ UNCHANGED turn
Confirm(v) ==
  /\ acked[v] # Nil
  /\ ~acked[v]
  /\ First = FALSE
  /\ acked' = [acked EXCEPT ![v] = TRUE]
  /\ turn' = (turn + 1) % 4
Reset(v) ==
  /\ acked[v] # Nil
  /\ acked[v]
  /\ turn = 1
  /\ acked' = [acked EXCEPT ![v] = Nil]
  /\ UNCHANGED turn
Next == Pick \/ \E v \in Values : Ack(v) \/ Confirm(v) \/ Reset(v)
====
