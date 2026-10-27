---- MODULE SymmetricMessages ----
EXTENDS Naturals, TLC
CONSTANT Proc
VARIABLE msgs
Init == msgs = {}
Vote == \E p \in Proc, n \in 1..2 : msgs' = msgs \cup {[type |-> "vote", from |-> p, round |-> n]}
Tick == \E n \in 1..2 : msgs' = msgs \cup {[type |-> "tick", round |-> n]}
Next == Vote \/ Tick
Spec == Init /\ [][Next]_msgs
Symmetric == Permutations(Proc)
====
