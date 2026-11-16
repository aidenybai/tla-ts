(*---
description: tlapm's own test fast/enabled_cdot/Fairness_INSTANCE_test.tla.
ref: test/fast/enabled_cdot/Fairness_INSTANCE_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE Fairness_INSTANCE_test ----
EXTENDS Integers, TLAPS

---- MODULE Inner ----
EXTENDS Integers
VARIABLES x, y

Next == x' = x + 1 /\ y' = y - 1
vars == <<x, y>>
En == ENABLED <<Next>>_vars
WFair == WF_vars(Next)
SFair == SF_vars(Next)
======================

VARIABLES u, v, z

TypeOK == z \in Int

\* Instantiated WF/SF unfolds to the instantiated ENABLED (I!En, J!En), so
\* PTL can relate it to the definitions.  See test/soundness_tests/issue69_*
\* for the soundness tests (https://github.com/tlaplus/tlapm/issues/69).

\* Under the non-injective substitution x <- z, y <- z, I!En holds when
\* z \in Int, but the instantiated step <<I!Next>>_(I!vars) is impossible.
\* Hence []TypeOK /\ I!WFair and []TypeOK /\ I!SFair are both inconsistent.
I == INSTANCE Inner WITH x <- z, y <- z

LEMMA IEnHolds == TypeOK => I!En
BY ExpandENABLED DEF TypeOK, I!En

LEMMA StepImpossible == TypeOK => ~ <<I!Next>>_(I!vars)
BY DEF TypeOK, I!Next, I!vars

THEOREM InstantiatedWFairDef ==
  I!WFair <=> (<>[]I!En => []<><<I!Next>>_(I!vars))
BY PTL DEF I!WFair, I!En

THEOREM InstantiatedSFairDef ==
  I!SFair <=> ([]<>I!En => []<><<I!Next>>_(I!vars))
BY PTL DEF I!SFair, I!En

THEOREM InstantiatedWFairFalse == []TypeOK /\ I!WFair => FALSE
BY IEnHolds, StepImpossible, InstantiatedWFairDef, PTL

THEOREM InstantiatedSFairFalse == []TypeOK /\ I!SFair => FALSE
BY IEnHolds, StepImpossible, InstantiatedSFairDef, PTL

\* Under the injective renaming x <- u, y <- v, instantiated fairness is
\* equivalent to fairness of the instantiated action.
J == INSTANCE Inner WITH x <- u, y <- v

LEMMA JEnEquiv == J!En <=> ENABLED <<J!Next>>_(J!vars)
BY ExpandENABLED DEF J!En, J!Next, J!vars

THEOREM InjectiveWFair == J!WFair <=> WF_(J!vars)(J!Next)
<1>1. J!WFair <=> (<>[]J!En => []<><<J!Next>>_(J!vars))
  BY PTL DEF J!WFair, J!En
<1>. QED
  BY <1>1, JEnEquiv, PTL

THEOREM InjectiveSFair == J!SFair <=> SF_(J!vars)(J!Next)
<1>1. J!SFair <=> ([]<>J!En => []<><<J!Next>>_(J!vars))
  BY PTL DEF J!SFair, J!En
<1>. QED
  BY <1>1, JEnEquiv, PTL

=======================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 37:1:37:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 37:1:37:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 37:4:37:17
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 37:4:37:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 40:1:40:3
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 40:1:40:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 4
    @loc: 44:1:44:3
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 44:1:44:3
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 44:4:44:7
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 44:4:44:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 48:1:48:3
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 48:1:48:3
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 7
    @loc: 48:4:48:7
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 48:4:48:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 51:1:51:3
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 51:1:51:3
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 9
    @loc: 51:4:51:12
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 51:4:51:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 51:14:51:28
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 51:14:51:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 11
    @loc: 51:30:51:50
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 51:30:51:50
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 12
    @loc: 51:52:51:55
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 51:52:51:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 13
    @loc: 54:1:54:3
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 54:1:54:3
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 14
    @loc: 54:4:54:12
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 54:4:54:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 15
    @loc: 54:14:54:28
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 54:14:54:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 16
    @loc: 54:30:54:50
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 54:30:54:50
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 17
    @loc: 54:52:54:55
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 54:52:54:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 18
    @loc: 61:1:61:3
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 61:1:61:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 19
    @loc: 61:4:61:17
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 61:4:61:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 20
    @loc: 67:3:67:5
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 67:3:67:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 21
    @loc: 67:6:67:10
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 67:6:67:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 22
    @loc: 67:12:67:20
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 67:12:67:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 23
    @loc: 67:22:67:25
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 67:22:67:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 24
    @loc: 65:3:65:5
    @status: to be proved

    @type: obligation
    @id: 24
    @loc: 65:3:65:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 25
    @loc: 65:6:65:9
    @status: to be proved

    @type: obligation
    @id: 25
    @loc: 65:6:65:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 26
    @loc: 73:3:73:5
    @status: to be proved

    @type: obligation
    @id: 26
    @loc: 73:3:73:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 27
    @loc: 73:6:73:10
    @status: to be proved

    @type: obligation
    @id: 27
    @loc: 73:6:73:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 28
    @loc: 73:12:73:20
    @status: to be proved

    @type: obligation
    @id: 28
    @loc: 73:12:73:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 29
    @loc: 73:22:73:25
    @status: to be proved

    @type: obligation
    @id: 29
    @loc: 73:22:73:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 30
    @loc: 71:3:71:5
    @status: to be proved

    @type: obligation
    @id: 30
    @loc: 71:3:71:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 31
    @loc: 71:6:71:9
    @status: to be proved

    @type: obligation
    @id: 31
    @loc: 71:6:71:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 31

    @type: obligationsnumber
    @count: 0

    File "./Fairness_INSTANCE_test.tla", line 18, characters 17-20:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./Fairness_INSTANCE_test.tla", line 18, characters 24-27:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./Fairness_INSTANCE_test.tla", line 19, characters 18-21:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./Fairness_INSTANCE_test.tla", line 19, characters 10-16:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./Fairness_INSTANCE_test.tla", line 20, characters 18-21:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./Fairness_INSTANCE_test.tla", line 20, characters 10-16:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./Fairness_INSTANCE_test.tla", line 18, characters 17-20:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./Fairness_INSTANCE_test.tla", line 18, characters 24-27:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./Fairness_INSTANCE_test.tla", line 19, characters 18-21:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./Fairness_INSTANCE_test.tla", line 19, characters 10-16:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./Fairness_INSTANCE_test.tla", line 20, characters 18-21:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./Fairness_INSTANCE_test.tla", line 20, characters 10-16:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./Fairness_INSTANCE_test.tla", line 9, character 1 to line 75, character 39:
    [INFO]: All 31 obligations proved.
    File "./Fairness_INSTANCE_test.tla", line 12, character 1 to line 21, character 22:
    [INFO]: All 0 obligation proved.
---*)
