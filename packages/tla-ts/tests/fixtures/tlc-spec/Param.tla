---- MODULE Param ----
EXTENDS Naturals, TLC
VARIABLE d
T(s) == INSTANCE Step WITH count <- d, step <- s
Init == d = 0
Next == T(1)!StepNext \/ T(2)!StepNext \/ \E k \in {3} : T(k)!StepNext
SpecFromTlc ==
    [ actions |->
          { [ name |-> "T!StepNext",
              location |->
                  [ beginLine |-> 4,
                    beginColumn |-> 1,
                    endLine |-> 4,
                    endColumn |-> 48,
                    module |-> "Param" ],
              context |-> [s |-> 1],
              parameters |-> <<"s">> ],
            [ name |-> "T!StepNext",
              location |->
                  [ beginLine |-> 4,
                    beginColumn |-> 1,
                    endLine |-> 4,
                    endColumn |-> 48,
                    module |-> "Param" ],
              context |-> [s |-> 2],
              parameters |-> <<"s">> ],
            [ name |-> "T!StepNext",
              location |->
                  [ beginLine |-> 4,
                    beginColumn |-> 1,
                    endLine |-> 4,
                    endColumn |-> 48,
                    module |-> "Param" ],
              context |-> [s |-> 3],
              parameters |-> <<"s">> ] },
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
                    module |-> "Param" ] ] },
      variables |->
          { [ name |-> "d",
              location |->
                  [ beginLine |-> 3,
                    beginColumn |-> 10,
                    endLine |-> 3,
                    endColumn |-> 10,
                    module |-> "Param" ] ] },
      actionconstraints |-> {},
      constraints |-> {} ]

ASSUME TLCGet("spec") = SpecFromTlc
====
