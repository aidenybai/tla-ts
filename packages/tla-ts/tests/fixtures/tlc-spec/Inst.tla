---- MODULE Inst ----
EXTENDS Base, TLC
VARIABLE d
C == INSTANCE Counter WITH count <- d
Move(v) == v' = v /\ c' = c
Init == BaseInit /\ C!CInit
Next == \/ BaseNext /\ UNCHANGED d
        \/ C!CNext /\ UNCHANGED c
        \/ lab :: Move(d)
        \/ \E k \in {c} : d' = k /\ UNCHANGED c
Prop == [](c < 3) /\ [][C!CNext \/ d' = d \/ d' = c]_d
SpecFromTlc ==
    [ actions |->
          { [ name |-> "Move",
              location |->
                  [ beginLine |-> 9,
                    beginColumn |-> 19,
                    endLine |-> 9,
                    endColumn |-> 25,
                    module |-> "Inst" ] ],
            [ name |-> "Next",
              location |->
                  [ beginLine |-> 7,
                    beginColumn |-> 12,
                    endLine |-> 7,
                    endColumn |-> 34,
                    module |-> "Inst" ] ],
            [ name |-> "Next",
              location |->
                  [ beginLine |-> 8,
                    beginColumn |-> 12,
                    endLine |-> 8,
                    endColumn |-> 33,
                    module |-> "Inst" ] ],
            [ name |-> "Next",
              location |->
                  [ beginLine |-> 10,
                    beginColumn |-> 12,
                    endLine |-> 10,
                    endColumn |-> 47,
                    module |-> "Inst" ] ] },
      impliedinits |-> {},
      impliedactions |->
          { [ name |-> "Prop",
              location |->
                  [ beginLine |-> 11,
                    beginColumn |-> 24,
                    endLine |-> 11,
                    endColumn |-> 54,
                    module |-> "Inst" ] ] },
      invariants |->
          { [ name |-> "Prop",
              location |->
                  [ beginLine |-> 11,
                    beginColumn |-> 12,
                    endLine |-> 11,
                    endColumn |-> 16,
                    module |-> "Inst" ] ] },
      impliedtemporals |-> {},
      temporals |-> {},
      inits |->
          { [ name |-> "Init",
              location |->
                  [ beginLine |-> 6,
                    beginColumn |-> 9,
                    endLine |-> 6,
                    endColumn |-> 27,
                    module |-> "Inst" ] ] },
      variables |->
          { [ name |-> "d",
              location |->
                  [ beginLine |-> 3,
                    beginColumn |-> 10,
                    endLine |-> 3,
                    endColumn |-> 10,
                    module |-> "Inst" ] ],
            [ name |-> "c",
              location |->
                  [ beginLine |-> 3,
                    beginColumn |-> 10,
                    endLine |-> 3,
                    endColumn |-> 10,
                    module |-> "Base" ] ] },
      actionconstraints |-> {},
      constraints |-> {} ]

ASSUME TLCGet("spec") = SpecFromTlc
====
