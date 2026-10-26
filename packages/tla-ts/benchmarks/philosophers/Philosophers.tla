---------------------------- MODULE Philosophers ----------------------------
EXTENDS Naturals

CONSTANT Count

Seats == 0..(Count - 1)

Left(seat) == seat

Right(seat) == (seat + 1) % Count

VARIABLES phase, owner, meals

vars == <<phase, owner, meals>>

TypeOK == /\ phase \in [Seats -> {"thinking", "hungry", "eating"}]
          /\ owner \in [Seats -> Seats \cup {Count}]
          /\ meals \in [Seats -> 0..2]

Init == /\ phase = [seat \in Seats |-> "thinking"]
        /\ owner = [fork \in Seats |-> Count]
        /\ meals = [seat \in Seats |-> 0]

Hunger(seat) == /\ phase[seat] = "thinking"
                /\ meals[seat] < 2
                /\ phase' = [phase EXCEPT ![seat] = "hungry"]
                /\ UNCHANGED <<owner, meals>>

Pick(seat, fork) == /\ phase[seat] = "hungry"
                    /\ owner[fork] = Count
                    /\ owner' = [owner EXCEPT ![fork] = seat]
                    /\ UNCHANGED <<phase, meals>>

Eat(seat) == /\ phase[seat] = "hungry"
             /\ owner[Left(seat)] = seat
             /\ owner[Right(seat)] = seat
             /\ phase' = [phase EXCEPT ![seat] = "eating"]
             /\ meals' = [meals EXCEPT ![seat] = @ + 1]
             /\ UNCHANGED owner

Finish(seat) == /\ phase[seat] = "eating"
                /\ phase' = [phase EXCEPT ![seat] = "thinking"]
                /\ owner' = [fork \in Seats |-> IF owner[fork] = seat THEN Count ELSE owner[fork]]
                /\ UNCHANGED meals

Next == \E seat \in Seats :
          \/ Hunger(seat)
          \/ \E fork \in {Left(seat), Right(seat)} : Pick(seat, fork)
          \/ Eat(seat)
          \/ Finish(seat)

Spec == Init /\ [][Next]_vars

NoSharedFork == \A seat \in Seats : phase[seat] = "eating" =>
                  owner[Left(seat)] = seat /\ owner[Right(seat)] = seat
=============================================================================
