---- MODULE Unnamed ----
EXTENDS Naturals, TLC
VARIABLE d
INSTANCE Two WITH count <- d
Init == d = 0
Next == TwoNext
SpecFromTlc ==
    [ actions |->
          { [ name |-> "TwoNext",
              location |->
                  [ beginLine |-> 4,
                    beginColumn |-> 1,
                    endLine |-> 4,
                    endColumn |-> 28,
                    module |-> "Unnamed" ] ] },
      impliedinits |-> {},
      impliedactions |-> {},
      invariants |-> {},
      impliedtemporals |-> {},
      temporals |-> {},
      inits |->
          { [ name |-> "Init",
              location |->
                  [ beginLine |-> 5,
                    beginColumn |-> 9,
                    endLine |-> 5,
                    endColumn |-> 13,
                    module |-> "Unnamed" ] ] },
      variables |->
          { [ name |-> "d",
              location |->
                  [ beginLine |-> 3,
                    beginColumn |-> 10,
                    endLine |-> 3,
                    endColumn |-> 10,
                    module |-> "Unnamed" ] ] },
      actionconstraints |-> {},
      constraints |-> {} ]

ASSUME TLCGet("spec") = SpecFromTlc
====
