---- MODULE Subst ----
EXTENDS Naturals, TLC
VARIABLE d
T == INSTANCE Two WITH count <- d
Init == d = 0
Next == T!TwoNext
SpecFromTlc ==
    [ actions |->
          { [ name |-> "T!TwoNext",
              location |->
                  [ beginLine |-> 4,
                    beginColumn |-> 1,
                    endLine |-> 4,
                    endColumn |-> 33,
                    module |-> "Subst" ] ] },
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
                    module |-> "Subst" ] ] },
      variables |->
          { [ name |-> "d",
              location |->
                  [ beginLine |-> 3,
                    beginColumn |-> 10,
                    endLine |-> 3,
                    endColumn |-> 10,
                    module |-> "Subst" ] ] },
      actionconstraints |-> {},
      constraints |-> {} ]

ASSUME TLCGet("spec") = SpecFromTlc
====
