(*---
description: tlapm's own test fast/enabled_cdot/Level_test.tla, which checks stderr status:failed.
ref: test/fast/enabled_cdot/Level_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------------------------ MODULE Level_test -------------------------------
(* Tests for computing expression levels. *)
EXTENDS TLAPS, Integers, TLC


CONSTANT c
VARIABLES x, y


P == ENABLED (x')

f(g) == TRUE
h(r, w) == TRUE

Q == /\ IF x THEN x' ELSE c
     /\ 1 + 2
        (* {r \in S:  P(r)} set such that *)
     /\ {r \in {1, 2}:  TRUE}
     /\ {r \in {1, 2}:  c}
     /\ {r \in {1, 2}:  x}
     /\ {r \in {1, 2}:  x'}
     /\ {r \in {1, 2}:  r + 1}
     /\ {r \in {1, 2}:  r + x}
     /\ {r \in {1, 2}:  r + x'}
     /\ {r \in x:  TRUE}
     /\ {r \in x':  TRUE}
        (* {f(z):  z \in S} *)
     /\ {f(g):  g \in x}
     /\ {f(g):  g \in x'}
     /\ {h(z, w):  z \in x,  w \in x'}
        (* {1, 2, 3} set enumeration *)
     /\ {1, 2, 3}
     /\ {c, 1}
     /\ {c, x}
     /\ {x, 1}
     /\ {x, x'}
     /\ {x', 1}
     /\ {c, x'}
     /\ {c, x, x'}
        (* Tuples *)
     /\ << 1, 2, 3 >>
     /\ << c, 1, 2 >>
     /\ << x, 1, 2 >>
     /\ << x, 1, c >>
     /\ << x, x', c >>
        (* Function application *)
     /\ 1[1]
     /\ c[1]
     /\ x[1]
     /\ x[c]
     /\ x[x']
     /\ (x')[x]
        (* [f EXCEPT ![1] = 2] *)
     /\ [c EXCEPT ![1] = 2]
     /\ [c EXCEPT ![x] = 2]
     /\ [c EXCEPT ![x'] = 2]
     /\ [c EXCEPT ![1] = x]
     /\ [c EXCEPT ![1] = x']

     /\ [x EXCEPT ![1] = 2]
     /\ [x EXCEPT ![c] = 2]
     /\ [x EXCEPT ![x] = 2]
     /\ [x EXCEPT ![x'] = 2]

     /\ [x EXCEPT ![1] = c]
     /\ [x EXCEPT ![1] = x]
     /\ [x EXCEPT ![1] = x']

     /\ [x' EXCEPT ![1] = 2]
     /\ [x' EXCEPT ![c] = 2]
     /\ [x' EXCEPT ![x] = 2]
     /\ [x' EXCEPT ![x'] = 2]

     /\ [x' EXCEPT ![1] = c]
     /\ [x' EXCEPT ![1] = x]
     /\ [x' EXCEPT ![1] = x']
        (* rigid quantification *)
     /\ \E r:  r
     /\ \E r \in {1}:  r
     /\ \E r, w:  r /\ w
     /\ \E r \in {1}, w \in {1}:  r /\ w
     /\ \E r \in {1}, w \in {2}:  r /\ w
     /\ \E r, w \in {1}:  r /\ w
     /\ \E r \in {1, 2}:  r
     /\ \E r \in x:  r
     /\ \E r \in x':  r
     /\ \E r:  c
     /\ \E r:  x
     /\ \E r:  x'
     /\ \E r, w:  x'
        (* CHOOSE *)
     /\ CHOOSE r:  r = 1
        (* ENABLED *)
     /\ ENABLED c
     /\ ENABLED x
     /\ ENABLED (x + 1)
     /\ ENABLED (x')
     /\ ENABLED (x + x')
        (* [A]_e *)
     /\ [x' = x + 1]_x
        (* << A >>_e *)
     /\ << x' = x + 1 >>_x
     /\ UNCHANGED x
     /\ UNCHANGED << x, y >>

     /\ LET R(w) == TRUE
        IN R(TRUE)
     /\ Print(1, "message")
     /\ Assert(1, "message")
     /\ JavaTime
     /\ {1} :> 2
     /\ 1 @@ 2
     /\ Permutations({1, 2, 3})


THEOREM ENABLED Q
PROOF
    BY ExpandENABLED DEF Q


THEOREM SortSeq(<<1, 2, 3>>, <)
OBVIOUS

================================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 126:5:126:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 126:5:126:7
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: isabelle : unsupported operator SetOf (multiple declared constants)
    @already: false
    @obl: 
    ASSUME NEW CONSTANT c,
           NEW VARIABLE x,
           NEW VARIABLE y,
           TRUE 
    PROVE  \E y#enabled#prime1, x#enabled#prime1 :
              /\ IF x THEN x#enabled#prime1 ELSE c
              /\ 1 + 2
              /\ {r \in {1, 2} : TRUE}
              /\ {r \in {1, 2} : c}
              /\ {r \in {1, 2} : x}
              /\ {r \in {1, 2} : x#enabled#prime1}
              /\ {r \in {1, 2} : r + 1}
              /\ {r \in {1, 2} : r + x}
              /\ {r \in {1, 2} : r + x#enabled#prime1}
              /\ {r \in x : TRUE}
              /\ {r \in x#enabled#prime1 : TRUE}
              /\ {f(g) : g \in x}
              /\ {f(g) : g \in x#enabled#prime1}
              /\ {h(z, w) : z \in x, w \in x#enabled#prime1}
              /\ {1, 2, 3}
              /\ {c, 1}
              /\ {c, x}
              /\ {x, 1}
              /\ {x, x#enabled#prime1}
              /\ {x#enabled#prime1, 1}
              /\ {c, x#enabled#prime1}
              /\ {c, x, x#enabled#prime1}
              /\ <<1, 2, 3>>
              /\ <<c, 1, 2>>
              /\ <<x, 1, 2>>
              /\ <<x, 1, c>>
              /\ <<x, x#enabled#prime1, c>>
              /\ 1[1]
              /\ c[1]
              /\ x[1]
              /\ x[c]
              /\ x[x#enabled#prime1]
              /\ x#enabled#prime1[x]
              /\ [c EXCEPT ![1] = 2]
              /\ [c EXCEPT ![x] = 2]
              /\ [c EXCEPT ![x#enabled#prime1] = 2]
              /\ [c EXCEPT ![1] = x]
              /\ [c EXCEPT ![1] = x#enabled#prime1]
              /\ [x EXCEPT ![1] = 2]
              /\ [x EXCEPT ![c] = 2]
              /\ [x EXCEPT ![x] = 2]
              /\ [x EXCEPT ![x#enabled#prime1] = 2]
              /\ [x EXCEPT ![1] = c]
              /\ [x EXCEPT ![1] = x]
              /\ [x EXCEPT ![1] = x#enabled#prime1]
              /\ [x#enabled#prime1 EXCEPT ![1] = 2]
              /\ [x#enabled#prime1 EXCEPT ![c] = 2]
              /\ [x#enabled#prime1 EXCEPT ![x] = 2]
              /\ [x#enabled#prime1 EXCEPT ![x#enabled#prime1] = 2]
              /\ [x#enabled#prime1 EXCEPT ![1] = c]
              /\ [x#enabled#prime1 EXCEPT ![1] = x]
              /\ [x#enabled#prime1 EXCEPT ![1] = x#enabled#prime1]
              /\ \E r : r
              /\ \E r \in {1} : r
              /\ \E r, w : r /\ w
              /\ \E r \in {1}, w \in {1} : r /\ w
              /\ \E r \in {1}, w \in {2} : r /\ w
              /\ \E r, w \in {1} : r /\ w
              /\ \E r \in {1, 2} : r
              /\ \E r \in x : r
              /\ \E r \in x#enabled#prime1 : r
              /\ \E r : c
              /\ \E r : x
              /\ \E r : x#enabled#prime1
              /\ \E r, w : x#enabled#prime1
              /\ CHOOSE r : r = 1
              /\ \E r#0 : c
              /\ \E r#0 : x
              /\ \E r#0 : x + 1
              /\ \E x#enabled#prime2 : x#enabled#prime2
              /\ \E x#enabled#prime2 : x + x#enabled#prime2
              /\ x#enabled#prime1 = x + 1 \/ x#enabled#prime1 = x
              /\ x#enabled#prime1 = x + 1 /\ ~x#enabled#prime1 = x
              /\ x#enabled#prime1 = x
              /\ /\ x#enabled#prime1 = x
                 /\ y#enabled#prime1 = y
              /\ TRUE
              /\ Print(1, "message")
              /\ Assert(1, "message")
              /\ JavaTime
              /\ {1} :> 2
              /\ 1 @@ 2
              /\ Permutations({1, 2, 3})

    @type: obligation
    @id: 2
    @loc: 126:8:126:21
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 126:8:126:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 130:1:130:8
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 130:1:130:8
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT c,
           NEW VARIABLE x,
           NEW VARIABLE y
    PROVE  SortSeq(<<1, 2, 3>>, LAMBDA x1, x2 : x1 < x2)

    @type: obligationsnumber
    @count: 3

    Zenon error: exhausted search space without finding a proof
    File "./Level_test.tla", line 130, characters 1-7:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT c,
                      NEW VARIABLE x,
                      NEW VARIABLE y
               PROVE  SortSeq(<<1, 2, 3>>, LAMBDA x1, x2 : x1 < x2)
    File "./Level_test.tla", line 126, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT c,
                      NEW VARIABLE x,
                      NEW VARIABLE y,
                      Q ==
                        /\ IF x THEN x' ELSE c
                        /\ 1 + 2
                        /\ {r \in {1, 2} : TRUE}
                        /\ {r \in {1, 2} : c}
                        /\ {r \in {1, 2} : x}
                        /\ {r \in {1, 2} : x'}
                        /\ {r \in {1, 2} : r + 1}
                        /\ {r \in {1, 2} : r + x}
                        /\ {r \in {1, 2} : r + x'}
                        /\ {r \in x : TRUE}
                        /\ {r \in x' : TRUE}
                        /\ {f(g) : g \in x}
                        /\ {f(g) : g \in x'}
                        /\ {h(z, w) : z \in x, w \in x'}
                        /\ {1, 2, 3}
                        /\ {c, 1}
                        /\ {c, x}
                        /\ {x, 1}
                        /\ {x, x'}
                        /\ {x', 1}
                        /\ {c, x'}
                        /\ {c, x, x'}
                        /\ <<1, 2, 3>>
                        /\ <<c, 1, 2>>
                        /\ <<x, 1, 2>>
                        /\ <<x, 1, c>>
                        /\ <<x, x', c>>
                        /\ 1[1]
                        /\ c[1]
                        /\ x[1]
                        /\ x[c]
                        /\ x[x']
                        /\ (x')[x]
                        /\ [c EXCEPT ![1] = 2]
                        /\ [c EXCEPT ![x] = 2]
                        /\ [c EXCEPT ![x'] = 2]
                        /\ [c EXCEPT ![1] = x]
                        /\ [c EXCEPT ![1] = x']
                        /\ [x EXCEPT ![1] = 2]
                        /\ [x EXCEPT ![c] = 2]
                        /\ [x EXCEPT ![x] = 2]
                        /\ [x EXCEPT ![x'] = 2]
                        /\ [x EXCEPT ![1] = c]
                        /\ [x EXCEPT ![1] = x]
                        /\ [x EXCEPT ![1] = x']
                        /\ [x' EXCEPT ![1] = 2]
                        /\ [x' EXCEPT ![c] = 2]
                        /\ [x' EXCEPT ![x] = 2]
                        /\ [x' EXCEPT ![x'] = 2]
                        /\ [x' EXCEPT ![1] = c]
                        /\ [x' EXCEPT ![1] = x]
                        /\ [x' EXCEPT ![1] = x']
                        /\ \E r : r
                        /\ \E r \in {1} : r
                        /\ \E r, w : r /\ w
                        /\ \E r \in {1}, w \in {1} : r /\ w
                        /\ \E r \in {1}, w \in {2} : r /\ w
                        /\ \E r, w \in {1} : r /\ w
                        /\ \E r \in {1, 2} : r
                        /\ \E r \in x : r
                        /\ \E r \in x' : r
                        /\ \E r : c
                        /\ \E r : x
                        /\ \E r : x'
                        /\ \E r, w : x'
                        /\ CHOOSE r : r = 1
                        /\ ENABLED c
                        /\ ENABLED x
                        /\ ENABLED (x + 1)
                        /\ ENABLED (x')
                        /\ ENABLED (x + x')
                        /\ [x' = x + 1]_x
                        /\ <<x' = x + 1>>_x
                        /\ UNCHANGED x
                        /\ UNCHANGED <<x, y>>
                        /\ LET R(w) == TRUE
                           IN  R(TRUE)
                        /\ Print(1, "message")
                        /\ Assert(1, "message")
                        /\ JavaTime
                        /\ {1} :> 2
                        /\ 1 @@ 2
                        /\ Permutations({1, 2, 3}),
                      ExpandENABLED 
               PROVE  ENABLED Q
    File "./Level_test.tla", line 9, character 1 to line 132, character 80:
    [ERROR]: 2/3 obligations failed.
    There were backend errors processing module `"Level_test"`.
---*)
