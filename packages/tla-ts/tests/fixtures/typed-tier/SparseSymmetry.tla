---- MODULE SparseSymmetry ----
EXTENDS Naturals, TLC
CONSTANT Procs
VARIABLES owner, ticket
Init == owner = <<>> /\ ticket = 0
Claim ==
  \E p \in Procs :
    /\ p \notin DOMAIN owner
    /\ ticket < 4
    /\ owner' = owner @@ (p :> [ticket |-> ticket, peer |-> CHOOSE q \in Procs : q # p])
    /\ ticket' = ticket + 1
Release ==
  \E p \in DOMAIN owner :
    /\ owner' = [q \in DOMAIN owner \ {p} |-> owner[q]]
    /\ UNCHANGED ticket
Next == Claim \/ Release
Symmetry == Permutations(Procs)
====
