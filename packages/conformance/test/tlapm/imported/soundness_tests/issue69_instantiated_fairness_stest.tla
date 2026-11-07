(*---
description: tlapm's soundness test issue69_instantiated_fairness_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue69_instantiated_fairness_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue69_instantiated_fairness_stest --------------
\* https://github.com/tlaplus/tlapm/issues/69
\* The issue's modules XY and Z, with XY inlined.  ExpandENABLED replaces
\* ENABLEDrules, which never reached main.  The false lemma about XY!En is
\* dropped, since tlapm no longer proves it.
EXTENDS Integers, TLAPS

VARIABLE z

--------------------------------- MODULE XY ---------------------------------
EXTENDS Integers, NaturalsInduction, TLAPS
VARIABLES x,y

(***************************************************************************)
(* A simple specification with two integer variables x and y. Both         *)
(* variables are initially 0, and at each step x is incremented and        *)
(* y is decremented. We prove a few simple properties, and in particular   *)
(* a liveness property showing that the values of x and y diverge.         *)
(***************************************************************************)

Init == x=0 /\ y=0
Next == x'=x+1 /\ y'=y-1
vars == <<x,y>>
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

TypeOK == x \in Int /\ y \in Int

En == ENABLED <<Next>>_vars
Fair == WF_vars(Next)

THEOREM Type == Init /\ [][Next]_vars => []TypeOK
<1>1. Init => TypeOK
  BY DEF Init, TypeOK
<1>2. TypeOK /\ [Next]_vars => TypeOK'
  BY DEF Next, vars, TypeOK
<1>. QED  BY <1>1, <1>2, PTL

(***************************************************************************)
(* The next-state action is always enabled; the type-correctness           *)
(* condition ensures that the values of x and y change.                    *)
(***************************************************************************)
LEMMA Enabled == TypeOK => ENABLED <<Next>>_vars
<1>. SUFFICES ASSUME TypeOK
              PROVE  ENABLED <<Next>>_vars
  OBVIOUS
<1>1. <<Next>>_vars <=> Next
  BY DEF Next, vars, TypeOK
<1>2. (ENABLED <<Next>>_vars) <=> (ENABLED Next)
  BY ExpandENABLED DEF Next, vars, TypeOK
<1>3. ENABLED Next
  BY ExpandENABLED DEF Next
<1>. QED  BY <1>2, <1>3

(***************************************************************************)
(* For any natural number n, the value of x will eventually be at least n, *)
(* and the value of y at most -n.                                          *)
(***************************************************************************)
THEOREM Live == Spec => \A n \in Nat : <>(x >= n /\ y <= -n)
<1>. DEFINE P(n) == x >= n /\ y <= -n
            Q(n) == Spec => <>P(n)
<1>1. Q(0)
  <2>1. Init => P(0)
    BY DEF Init
  <2>. QED  BY <2>1, PTL DEF Spec
<1>2. ASSUME NEW n \in Nat
      PROVE  Q(n) => Q(n+1)
  <2>1. TypeOK /\ P(n) /\ [Next]_vars => P(n)' \/ P(n+1)'
    BY DEF TypeOK, Next, vars
  <2>2. TypeOK /\ P(n) /\ <<Next>>_vars => P(n+1)'
    BY DEF TypeOK, Next, vars
  <2>. QED  BY <2>1, <2>2, Type, Enabled, PTL DEF Spec
<1>3. \A n \in Nat : Q(n)
  <2>. HIDE DEF Q
  <2>. QED  BY <1>1, <1>2, NatInduction, Isa
<1>. QED  BY <1>3

=============================================================================

(***************************************************************************)
(* We define a boring specification with a single variable z that is       *)
(* initialized to 0 and never changes.                                     *)
(***************************************************************************)

Init == z=0
Next == FALSE
Spec == Init /\ [][Next]_z

(***************************************************************************)
(* We now instantiate the specification XY such that both variables x      *)
(* and y are substituted by the variable z.                                *)
(* The instantiated fairness condition is equivalent to the formula        *)
(*   []([](\E xp, yp: xp = z+1 /\ yp = z-1 /\ <<xp,yp>> # <<z,z>>)         *)
(*      => <><<z' = z+1 /\ z' = z-1>>_<<z,z>>)                             *)
(* Observe that the left-hand side of the implication is always true in    *)
(* the presence of the type correctness condition, whereas the right-hand  *)
(* side can never be true. Therefore the instantiated fairness condition   *)
(* is equivalent to FALSE, and so is XY!Spec.                              *)
(***************************************************************************)
XY == INSTANCE XY WITH x <- z, y <- z

LEMMA XY!Fair <=> WF_(XY!vars)(XY!Next)
BY DEF XY!Fair

(***************************************************************************)
(* In contrast, the instantiated next-state action is never enabled.       *)
(***************************************************************************)
LEMMA NotEnabled == XY!TypeOK => ~ ENABLED <<XY!Next>>_(XY!vars)
<1>. SUFFICES ASSUME XY!TypeOK, ENABLED <<XY!Next>>_(XY!vars)
              PROVE  FALSE
  OBVIOUS
<1>1. <<XY!Next>>_(XY!vars) => XY!Next
  OBVIOUS
<1>2. (ENABLED <<XY!Next>>_(XY!vars)) => (ENABLED XY!Next)
  BY ExpandENABLED DEF XY!Next, XY!vars
<1>3. (ENABLED XY!Next) => \E zz : zz = z+1 /\ zz = z-1
  BY ExpandENABLED DEF XY!Next, XY!vars
<1>. QED  BY <1>2, <1>3 DEF XY!TypeOK

(***************************************************************************)
(* TLAPS lets us prove that the boring specification implements the        *)
(* instantiated specification. As we have argued above, the instantiated   *)
(* specification is equivalent to FALSE, whereas Spec is not.              *)
(***************************************************************************)
THEOREM Wrong == Spec => XY!Spec
<1>1. Init => XY!Init
  BY DEF Init, XY!Init
<1>2. [Next]_z => [XY!Next]_(XY!vars)
  BY DEF Next, XY!Next, XY!vars
<1>3. Spec => WF_(XY!vars)(XY!Next)
  <2>. SUFFICES ASSUME []XY!TypeOK, []ENABLED <<XY!Next>>_(XY!vars)
                PROVE  FALSE
    BY <1>1, <1>2, XY!Type, PTL DEF Spec
  <2>. QED  BY NotEnabled, PTL
<1>. QED  BY <1>1, <1>2, <1>3, PTL DEF Spec, XY!Spec

(***************************************************************************)
(* Combining the above refinement theorem and the instantiated liveness    *)
(* theorem, we show an absurdity: for any natural number n, the value of   *)
(* z eventually is both at least n and at most -n.                         *)
(* Note that the theorem XY!Live is still valid because XY!Spec is         *)
(* equivalent to FALSE. The absurdity is a consequence of the wrong        *)
(* refinement theorem.                                                     *)
(***************************************************************************)
COROLLARY Absurd == Spec => \A n \in Nat : <>(z >= n /\ z <= -n)
BY Wrong, XY!Live

=============================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 44:11:44:13
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 44:11:44:13
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: true

    @type: obligation
    @id: 2
    @loc: 44:14:44:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 44:14:44:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 44:20:44:24
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 44:20:44:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 44:26:44:29
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 44:26:44:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 41:3:41:5
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 41:3:41:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 6
    @loc: 43:3:43:5
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 43:3:43:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 7
    @loc: 60:11:60:13
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 60:11:60:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 8
    @loc: 60:14:60:18
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 60:14:60:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 60:20:60:24
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 60:20:60:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 53:3:53:10
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 53:3:53:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 11
    @loc: 55:3:55:5
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 55:3:55:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 12
    @loc: 57:3:57:5
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 57:3:57:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 13
    @loc: 57:6:57:19
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 57:6:57:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 14
    @loc: 59:3:59:5
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 59:3:59:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 15
    @loc: 59:6:59:19
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 59:6:59:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 16
    @loc: 83:11:83:13
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 83:11:83:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 17
    @loc: 83:14:83:18
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 83:14:83:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 18
    @loc: 72:13:72:15
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 72:13:72:15
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: true

    @type: obligation
    @id: 19
    @loc: 72:16:72:20
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 72:16:72:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 20
    @loc: 72:22:72:25
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 72:22:72:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 21
    @loc: 71:5:71:7
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 71:5:71:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 22
    @loc: 79:13:79:15
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 79:13:79:15
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: true

    @type: obligation
    @id: 23
    @loc: 79:16:79:20
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 79:16:79:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 24
    @loc: 79:22:79:26
    @status: to be proved

    @type: obligation
    @id: 24
    @loc: 79:22:79:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 25
    @loc: 79:28:79:32
    @status: to be proved

    @type: obligation
    @id: 25
    @loc: 79:28:79:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 26
    @loc: 79:34:79:41
    @status: to be proved

    @type: obligation
    @id: 26
    @loc: 79:34:79:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 27
    @loc: 79:43:79:46
    @status: to be proved

    @type: obligation
    @id: 27
    @loc: 79:43:79:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 28
    @loc: 76:5:76:7
    @status: to be proved

    @type: obligation
    @id: 28
    @loc: 76:5:76:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 29
    @loc: 78:5:78:7
    @status: to be proved

    @type: obligation
    @id: 29
    @loc: 78:5:78:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 30
    @loc: 82:13:82:15
    @status: to be proved

    @type: obligation
    @id: 30
    @loc: 82:13:82:15
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: true

    @type: obligation
    @id: 31
    @loc: 82:16:82:20
    @status: to be proved

    @type: obligation
    @id: 31
    @loc: 82:16:82:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 32
    @loc: 82:22:82:26
    @status: to be proved

    @type: obligation
    @id: 32
    @loc: 82:22:82:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 33
    @loc: 82:28:82:40
    @status: to be proved

    @type: obligation
    @id: 33
    @loc: 82:28:82:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 34
    @loc: 82:42:82:45
    @status: to be proved

    @type: obligation
    @id: 34
    @loc: 82:42:82:45
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 38
    @loc: 110:1:110:3
    @status: to be proved

    @type: obligation
    @id: 38
    @loc: 110:1:110:3
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE z
    PROVE  (<>[]?EnabledWrapper(LAMBDA r#0, r#1 :
                                  r#1 = z + 1 /\ r#0 = z - 1
                                  /\ ~(/\ r#1 = z
                                       /\ r#0 = z))
            => []<><<XY!Next>>_XY!vars)
           <=> (WF_(XY!vars) (XY!Next))

    @type: obligation
    @id: 39
    @loc: 125:11:125:13
    @status: to be proved

    @type: obligation
    @id: 39
    @loc: 125:11:125:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 40
    @loc: 125:14:125:18
    @status: to be proved

    @type: obligation
    @id: 40
    @loc: 125:14:125:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 41
    @loc: 125:20:125:24
    @status: to be proved

    @type: obligation
    @id: 41
    @loc: 125:20:125:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 42
    @loc: 118:3:118:10
    @status: to be proved

    @type: obligation
    @id: 42
    @loc: 118:3:118:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 43
    @loc: 120:3:120:10
    @status: to be proved

    @type: obligation
    @id: 43
    @loc: 120:3:120:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 44
    @loc: 122:3:122:5
    @status: to be proved

    @type: obligation
    @id: 44
    @loc: 122:3:122:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 45
    @loc: 122:6:122:19
    @status: to be proved

    @type: obligation
    @id: 45
    @loc: 122:6:122:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 46
    @loc: 124:3:124:5
    @status: to be proved

    @type: obligation
    @id: 46
    @loc: 124:3:124:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 47
    @loc: 124:6:124:19
    @status: to be proved

    @type: obligation
    @id: 47
    @loc: 124:6:124:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 48
    @loc: 142:11:142:13
    @status: to be proved

    @type: obligation
    @id: 48
    @loc: 142:11:142:13
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE z,
           Init => XY!Init ,
           [Next]_z => [XY!Next]_XY!vars ,
           Init /\ [][Next]_z => (WF_(XY!vars) (XY!Next)) ,
           TRUE 
    PROVE  Init /\ [][Next]_z
           => XY!Init /\ [][XY!Next]_XY!vars
              /\ (<>[]?EnabledWrapper(LAMBDA r#0, r#1 :
                                        r#1 = z + 1 /\ r#0 = z - 1
                                        /\ ~(/\ r#1 = z
                                             /\ r#0 = z))
                  => []<><<XY!Next>>_XY!vars)

    @type: obligation
    @id: 49
    @loc: 142:14:142:18
    @status: to be proved

    @type: obligation
    @id: 49
    @loc: 142:14:142:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 50
    @loc: 142:20:142:24
    @status: to be proved

    @type: obligation
    @id: 50
    @loc: 142:20:142:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 51
    @loc: 142:26:142:30
    @status: to be proved

    @type: obligation
    @id: 51
    @loc: 142:26:142:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 52
    @loc: 142:32:142:35
    @status: to be proved

    @type: obligation
    @id: 52
    @loc: 142:32:142:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 53
    @loc: 134:3:134:5
    @status: to be proved

    @type: obligation
    @id: 53
    @loc: 134:3:134:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 54
    @loc: 136:3:136:5
    @status: to be proved

    @type: obligation
    @id: 54
    @loc: 136:3:136:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 55
    @loc: 141:13:141:15
    @status: to be proved

    @type: obligation
    @id: 55
    @loc: 141:13:141:15
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 56
    @loc: 141:16:141:26
    @status: to be proved

    @type: obligation
    @id: 56
    @loc: 141:16:141:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 57
    @loc: 141:28:141:31
    @status: to be proved

    @type: obligation
    @id: 57
    @loc: 141:28:141:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 58
    @loc: 140:5:140:7
    @status: to be proved

    @type: obligation
    @id: 58
    @loc: 140:5:140:7
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 59
    @loc: 140:8:140:12
    @status: to be proved

    @type: obligation
    @id: 59
    @loc: 140:8:140:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 60
    @loc: 140:14:140:18
    @status: to be proved

    @type: obligation
    @id: 60
    @loc: 140:14:140:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 61
    @loc: 140:20:140:27
    @status: to be proved

    @type: obligation
    @id: 61
    @loc: 140:20:140:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 62
    @loc: 140:29:140:32
    @status: to be proved

    @type: obligation
    @id: 62
    @loc: 140:29:140:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 63
    @loc: 153:1:153:3
    @status: to be proved

    @type: obligation
    @id: 63
    @loc: 153:1:153:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 64
    @loc: 153:4:153:9
    @status: to be proved

    @type: obligation
    @id: 64
    @loc: 153:4:153:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 65
    @loc: 153:11:153:18
    @status: to be proved

    @type: obligation
    @id: 65
    @loc: 153:11:153:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 34

    @type: obligationsnumber
    @count: 62

    File "./issue69_instantiated_fairness_stest.tla", line 32, characters 42-45:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./issue69_instantiated_fairness_stest.tla", line 32, characters 34-40:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./issue69_instantiated_fairness_stest.tla", line 36, characters 17-20:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./issue69_instantiated_fairness_stest.tla", line 36, characters 24-27:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./issue69_instantiated_fairness_stest.tla", line 37, characters 17-20:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./issue69_instantiated_fairness_stest.tla", line 37, characters 9-15:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./issue69_instantiated_fairness_stest.tla", line 50, characters 38-41:
    [INFO]: Auto-expanding the definition of operator:  Next
    File "./issue69_instantiated_fairness_stest.tla", line 50, characters 45-48:
    [INFO]: Auto-expanding the definition of operator:  vars
    File "./issue69_instantiated_fairness_stest.tla", line 18, character 1 to line 85, character 77:
    [INFO]: All 34 obligations proved.
    File "./issue69_instantiated_fairness_stest.tla", line 142, characters 11-12:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE z,
                      Spec == Init /\ [][Next]_z,
                      XY!Spec ==
                        XY!Init /\ [][XY!Next]_XY!vars
                        /\ (<>[]?EnabledWrapper
                                  (LAMBDA 
                                     r#0, r#1 :
                                     r#1 = z + 1 /\ r#0 = z - 1
                                     /\ 
                                     ~(/\ r#1 = z
                                       /\ r#0 = z))
                            => []<><<XY!Next>>_XY!vars),
                      <1>1 ,
                      <1>2 ,
                      <1>3 ,
                      PTL 
               PROVE  Spec => XY!Spec
    File "./issue69_instantiated_fairness_stest.tla", line 110, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE z,
                      XY!Fair ==
                        <>[]?EnabledWrapper
                              (LAMBDA r#0, r#1 :
                                 r#1 = z + 1 /\ r#0 = z - 1
                                 /\ ~(/\ r#1 = z
                                      /\ r#0 = z))
                        => []<><<XY!Next>>_XY!vars
               PROVE  XY!Fair <=> (WF_(XY!vars) (XY!Next))
    File "./issue69_instantiated_fairness_stest.tla", line 9, character 1 to line 155, character 77:
    [ERROR]: 2/62 obligations failed.
    There were backend errors processing module `"issue69_instantiated_fairness_stest"`.
---*)
