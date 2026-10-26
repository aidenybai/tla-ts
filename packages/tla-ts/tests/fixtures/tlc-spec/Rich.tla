---- MODULE Rich ----
EXTENDS Naturals, TLC
CONSTANT Procs
VARIABLES x, y,
  z
vars == <<x, y, z>>

TypeOK == x \in 0..3 /\ y \in BOOLEAN

InitX == x = 0
InitY ==
  /\ y = FALSE
  /\ z = {}

Inc(p) == /\ x < 3
          /\ x' = x + 1
          /\ UNCHANGED <<y, z>>

Toggle == y' = ~y /\ UNCHANGED <<x, z>>

Add(p, q) == z' = z \cup {<<p, q>>} /\ UNCHANGED <<x, y>>

Pick(S) == \E s \in S : z' = {s} /\ UNCHANGED <<x, y>>

Next == \/ \E p \in Procs : Inc(p)
        \/ Toggle
        \/ \E p \in Procs, q \in {1, 2} : Add(p, q)
        \/ (x = 3 /\ UNCHANGED vars)
        \/ \E v \in {x} : x' = v /\ UNCHANGED <<y, z>>
        \/ LET w == 1 IN Pick({<<w, w>>})
        \/ \E p \in {} : Toggle

Spec == InitX /\ InitY /\ (z = {}) /\ [][Next]_vars /\ WF_vars(Toggle) /\ SF_vars(Inc(1))

Live == <>(x = 3)
Box == [](x <= 3)
Steps == [][x' >= x]_x
Leads == (x = 0) ~> (x = 3)
Both == Box /\ Live
ForAll == \A p \in Procs : <>(x = p)
Const == 1 = 1
StateProp == x \in Nat
Constraint == x < 4
ActionConstraint == x' >= x
SpecFromTlc ==
    [ actions |->
          { [ name |-> "Toggle",
              location |->
                  [ beginLine |-> 19,
                    beginColumn |-> 11,
                    endLine |-> 19,
                    endColumn |-> 39,
                    module |-> "Rich" ] ],
            [ name |-> "Next",
              location |->
                  [ beginLine |-> 28,
                    beginColumn |-> 13,
                    endLine |-> 28,
                    endColumn |-> 35,
                    module |-> "Rich" ] ],
            [ name |-> "Next",
              location |->
                  [ beginLine |-> 29,
                    beginColumn |-> 12,
                    endLine |-> 29,
                    endColumn |-> 54,
                    module |-> "Rich" ] ],
            [ name |-> "Next",
              location |->
                  [ beginLine |-> 31,
                    beginColumn |-> 12,
                    endLine |-> 31,
                    endColumn |-> 31,
                    module |-> "Rich" ] ],
            [ name |-> "Inc",
              location |->
                  [ beginLine |-> 15,
                    beginColumn |-> 11,
                    endLine |-> 17,
                    endColumn |-> 31,
                    module |-> "Rich" ],
              context |-> [p |-> 1],
              parameters |-> <<"p">> ],
            [ name |-> "Inc",
              location |->
                  [ beginLine |-> 15,
                    beginColumn |-> 11,
                    endLine |-> 17,
                    endColumn |-> 31,
                    module |-> "Rich" ],
              context |-> [p |-> 2],
              parameters |-> <<"p">> ],
            [ name |-> "Add",
              location |->
                  [ beginLine |-> 21,
                    beginColumn |-> 14,
                    endLine |-> 21,
                    endColumn |-> 57,
                    module |-> "Rich" ],
              context |-> [p |-> 1, q |-> 1],
              parameters |-> <<"p", "q">> ],
            [ name |-> "Add",
              location |->
                  [ beginLine |-> 21,
                    beginColumn |-> 14,
                    endLine |-> 21,
                    endColumn |-> 57,
                    module |-> "Rich" ],
              context |-> [p |-> 1, q |-> 2],
              parameters |-> <<"p", "q">> ],
            [ name |-> "Add",
              location |->
                  [ beginLine |-> 21,
                    beginColumn |-> 14,
                    endLine |-> 21,
                    endColumn |-> 57,
                    module |-> "Rich" ],
              context |-> [p |-> 2, q |-> 1],
              parameters |-> <<"p", "q">> ],
            [ name |-> "Add",
              location |->
                  [ beginLine |-> 21,
                    beginColumn |-> 14,
                    endLine |-> 21,
                    endColumn |-> 57,
                    module |-> "Rich" ],
              context |-> [p |-> 2, q |-> 2],
              parameters |-> <<"p", "q">> ],
            [ name |-> "Pick",
              location |->
                  [ beginLine |-> 23,
                    beginColumn |-> 25,
                    endLine |-> 23,
                    endColumn |-> 54,
                    module |-> "Rich" ],
              context |-> [S |-> {<<1, 1>>}],
              parameters |-> <<"S">> ] },
      impliedinits |->
          { [ name |-> "StateProp",
              location |->
                  [ beginLine |-> 42,
                    beginColumn |-> 14,
                    endLine |-> 42,
                    endColumn |-> 22,
                    module |-> "Rich" ] ] },
      impliedactions |->
          { [ name |-> "Steps",
              location |->
                  [ beginLine |-> 37,
                    beginColumn |-> 12,
                    endLine |-> 37,
                    endColumn |-> 22,
                    module |-> "Rich" ] ] },
      invariants |->
          { [ name |-> "TypeOK",
              location |->
                  [ beginLine |-> 8,
                    beginColumn |-> 11,
                    endLine |-> 8,
                    endColumn |-> 37,
                    module |-> "Rich" ] ],
            [ name |-> "Both",
              location |->
                  [ beginLine |-> 36,
                    beginColumn |-> 11,
                    endLine |-> 36,
                    endColumn |-> 16,
                    module |-> "Rich" ] ] },
      impliedtemporals |->
          { [ name |-> "Live",
              location |->
                  [ beginLine |-> 35,
                    beginColumn |-> 9,
                    endLine |-> 35,
                    endColumn |-> 17,
                    module |-> "Rich" ] ],
            [ name |-> "Leads",
              location |->
                  [ beginLine |-> 38,
                    beginColumn |-> 10,
                    endLine |-> 38,
                    endColumn |-> 27,
                    module |-> "Rich" ] ],
            [ name |-> "Both",
              location |->
                  [ beginLine |-> 35,
                    beginColumn |-> 9,
                    endLine |-> 35,
                    endColumn |-> 17,
                    module |-> "Rich" ] ],
            [ name |-> "ForAll",
              location |->
                  [ beginLine |-> 40,
                    beginColumn |-> 28,
                    endLine |-> 40,
                    endColumn |-> 36,
                    module |-> "Rich" ] ] },
      temporals |->
          { [ name |-> "UnnamedAction",
              location |->
                  [ beginLine |-> 33,
                    beginColumn |-> 56,
                    endLine |-> 33,
                    endColumn |-> 70,
                    module |-> "Rich" ] ],
            [ name |-> "UnnamedAction",
              location |->
                  [ beginLine |-> 33,
                    beginColumn |-> 75,
                    endLine |-> 33,
                    endColumn |-> 89,
                    module |-> "Rich" ] ] },
      inits |->
          { [ name |-> "InitX",
              location |->
                  [ beginLine |-> 10,
                    beginColumn |-> 10,
                    endLine |-> 10,
                    endColumn |-> 14,
                    module |-> "Rich" ] ],
            [ name |-> "InitY",
              location |->
                  [ beginLine |-> 12,
                    beginColumn |-> 3,
                    endLine |-> 13,
                    endColumn |-> 11,
                    module |-> "Rich" ] ],
            [ name |-> "UnnamedAction",
              location |->
                  [ beginLine |-> 33,
                    beginColumn |-> 28,
                    endLine |-> 33,
                    endColumn |-> 33,
                    module |-> "Rich" ] ] },
      variables |->
          { [ name |-> "x",
              location |->
                  [ beginLine |-> 4,
                    beginColumn |-> 11,
                    endLine |-> 4,
                    endColumn |-> 11,
                    module |-> "Rich" ] ],
            [ name |-> "y",
              location |->
                  [ beginLine |-> 4,
                    beginColumn |-> 14,
                    endLine |-> 4,
                    endColumn |-> 14,
                    module |-> "Rich" ] ],
            [ name |-> "z",
              location |->
                  [ beginLine |-> 5,
                    beginColumn |-> 3,
                    endLine |-> 5,
                    endColumn |-> 3,
                    module |-> "Rich" ] ] },
      actionconstraints |->
          { [ name |-> "ActionConstraint",
              location |->
                  [ beginLine |-> 44,
                    beginColumn |-> 1,
                    endLine |-> 44,
                    endColumn |-> 27,
                    module |-> "Rich" ] ] },
      constraints |->
          { [ name |-> "Constraint",
              location |->
                  [ beginLine |-> 43,
                    beginColumn |-> 1,
                    endLine |-> 43,
                    endColumn |-> 19,
                    module |-> "Rich" ] ] } ]

ASSUME TLCGet("spec") = SpecFromTlc
====
