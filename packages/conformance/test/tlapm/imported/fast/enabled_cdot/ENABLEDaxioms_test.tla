(*---
description: tlapm's own test fast/enabled_cdot/ENABLEDaxioms_test.tla.
ref: test/fast/enabled_cdot/ENABLEDaxioms_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
------------------------- MODULE ENABLEDaxioms_test ----------------------------
(* Unit tests for the implementation of proof rules about `ENABLED`. *)
EXTENDS TLAPS


(* This statement declares three variables. *)
VARIABLE x, y, z


P == x = 1  (* A state predicate. *)
A == x' = 1 /\ y' = 1  (* An action with primed variables. *)
B == z' = 1  (* Another action with primed variables, such that the set of
    primed variables of action A is disjoint from the set of primed variables
    of action B. *)
R == y' = 1 /\ x' = 1  (* An action equivalent to action A. *)

--------------------------------------------------------------------------------
(* Proving that a state predicate can be moved outside the scope of ENABLED,
i.e., that from
    P \in BOOLEAN,
    A \in BOOLEAN,
    ENABLED (P /\ A),
    P is a state predicate
we deduce
    P /\ ENABLED A

The premises P \in BOOLEAN, A \in BOOLEAN, and ENABLED (P /\ A) must appear
as separate proof steps and listed in the BY statement where ENABLEDaxioms
appears. The premise that P is a state predicate is checked automatically by
TLAPS.

If the premises do not appear in this form, then the proof will not
succeed, because TLAPS checks the syntactic form of each premise, including the
levels of the expressions.
*)
THEOREM
    ASSUME P
    PROVE P /\ ENABLED A
PROOF
<1>1. P \in BOOLEAN
    BY DEF P
<1>2. A \in BOOLEAN
    BY DEF A
<1>3. ENABLED (P /\ A)
    (* With the proof directives ExpandENABLED and AutoUSE the expression
    ENABLED (P /\ A) is converted first to ENABLED (P /\ x' = 1 /\ y' = 1) and
    then to (\E u, v:  P /\ u = 1 /\ v = 1), which is equivalent to P,
    so implied by the assumption P (no need to expand the definition of P).
    *)
    BY ExpandENABLED, AutoUSE
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms


(* Proving that a state predicate can be moved inside the scope of ENABLED,
i.e., that from
    P \in BOOLEAN,
    A \in BOOLEAN,
    P /\ ENABLED A,
    P is a state predicate
we deduce
    ENABLED (P /\ A)

The premises P \in BOOLEAN, A \in BOOLEAN and P /\ ENABLED A must appear as
separate proof steps and listed in the BY statement where ENABLEDaxioms appears.
The premise that P is a state predicate is checked automatically by TLAPS.

If the premises do not appear in this form, then the proof will not succeed,
because TLAPS checks the syntactic form of each premise, including the levels
of the expressions.
*)
THEOREM
    ASSUME P
    PROVE ENABLED (P /\ A)
PROOF
<1>1. P \in BOOLEAN
    BY DEF P
<1>2. A \in BOOLEAN
    BY DEF A
<1>3. P /\ ENABLED A
    <2>1. ENABLED A
        (* AutoUSE expands action A, because it contains primed variables and
        is in the scope of ENABLED, to yield the expression
        ENABLED (x' = 1 /\ y' = 1). ExpandENABLED converts this expression to
        (\E u, v:  u = 1 /\ v = 1), which is valid.
        *)
        BY ExpandENABLED, AutoUSE
    <2> QED
        BY <2>1
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms

--------------------------------------------------------------------------------
(* Proving that ENABLED distributes over conjunction for actions with disjoint
sets of primed variables, i.e., that from
    A \in BOOLEAN,
    B \in BOOLEAN,
    ENABLED (A /\ B),
    A and B have disjoint sets of primed variables
we deduce
    (ENABLED A) /\ ENABLED B

The premises A \in BOOLEAN, B \in BOOLEAN, and ENABLED (A /\ B) must appear as
separate proof steps, and listed in the BY statement where ENABLEDaxioms
appears. The premise that A and B have disjoint sets of primed variables is
checked automatically by TLAPS.
*)


THEOREM
    (ENABLED A) /\ ENABLED B
PROOF
<1>1. A \in BOOLEAN
    BY DEF A
<1>2. B \in BOOLEAN
    BY DEF B
<1>3. ENABLED (A /\ B)
    (* The proof directive AutoUSE expands the definitions of operators A and B
    because they are actions in the scope of ENABLED. The result is the
    expression ENABLED (x' = 1 /\ y' = 1 /\ z' = 1). The proof directive
    ExpandENABLED converts this expression to the expression
    (\E u, v, w:  u = 1 /\ v = 1 /\ w = 1).
    *)
    BY ExpandENABLED, AutoUSE
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms


(* Proving that ENABLED can be factored out of conjunction for actions with
disjoint sets of primed variables, i.e., that from
    A \in BOOLEAN,
    B \in BOOLEAN,
    (ENABLED A) /\ ENABLED B,
    A and B have disjoint sets of primed variables
we deduce
    ENABLED (A /\ B)

The premises A \in BOOLEAN, B \in BOOLEAN, and (ENABLED A) /\ ENABLED B must
appear as separate proof steps, and listed in the BY statement where
ENABLEDaxioms appears. The premise that A and B have disjoint sets of primed
variables is checked automatically by TLAPS.
*)
THEOREM
    ENABLED (A /\ B)
PROOF
<1>1. A \in BOOLEAN
    BY DEF A
<1>2. B \in BOOLEAN
    BY DEF B
<1>3. (ENABLED A) /\ (ENABLED B)
    (* The proof directive AutoUSE expands the definitions of operators A and B
    because they are actions in the scope of ENABLED. The result is the
    expression (ENABLED (x' = 1 /\ y' = 1)) /\ (ENABLED (z' = 1)).
    The proof directive ExpandENABLED converts this expression to the
    expression (\E u, v:  u = 1 /\ v = 1) /\ (\E w:  w = 1).
    *)
    BY ExpandENABLED, AutoUSE
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms

--------------------------------------------------------------------------------

(* This theorem is similar to the previous one, with the difference that P
is a state predicate, instead of an action as A was. So the definition of P
does not contain any primed variables, thus its set of primed variables is
obviously disjoint from the set of primed variables of action B.
*)
THEOREM
    ASSUME P
    PROVE ENABLED (P /\ B)
PROOF
<1>1. P \in BOOLEAN
    BY DEF P
<1>2. B \in BOOLEAN
    BY DEF B
<1>3. (ENABLED P) /\ ENABLED B
    <2>1. ENABLED P
        BY ExpandENABLED, AutoUSE
    <2>2. ENABLED B
        BY ExpandENABLED, AutoUSE
    <2> QED
        BY <2>1, <2>2
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms

--------------------------------------------------------------------------------
(* Proving that ENABLED can be factored out of disjunction, i.e., that from
    A \in BOOLEAN,
    B \in BOOLEAN,
    (ENABLED A) \/ ENABLED B
we deduce
    ENABLED (A \/ B)

The premises A \in BOOLEAN, B \in BOOLEAN, and (ENABLED A) \/ ENABLED B must
appear as separate proof steps, and be listed in the BY statement where the
proof directive ENABLEDaxioms appears.
*)
THEOREM
    ENABLED (A \/ B)
PROOF
<1>1. A \in BOOLEAN
    BY DEF A
<1>2. B \in BOOLEAN
    BY DEF B
<1>3. (ENABLED A) \/ (ENABLED B)
    <2>1. ENABLED A
        BY ExpandENABLED, AutoUSE
    <2>2. ENABLED B
        BY ExpandENABLED, AutoUSE
    <2> QED
        BY <2>1, <2>2
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms


(* Proving that ENABLED distributes over the disjunction of actions, i.e., that
from
    A \in BOOLEAN,
    B \in BOOLEAN,
    ENABLED (A \/ B)
we deduce
    (ENABLED A) \/ ENABLED B

The premises A \in BOOLEAN, B \in BOOLEAN, ENABLED (A \/ B) need to appear as
separate proof steps, and be listed in the BY statement where the proof
directive ENABLEDaxioms appears.
*)
THEOREM
    (ENABLED A) \/ (ENABLED B)
PROOF
<1>1. A \in BOOLEAN
    BY DEF A
<1>2. B \in BOOLEAN
    BY DEF B
<1>3. ENABLED (A \/ B)
    BY ExpandENABLED, AutoUSE
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms

--------------------------------------------------------------------------------
(* Proving that equality of Boolean-valued actions implies equivalence of
enabledness of these actions, i.e., that from
    A \in BOOLEAN,
    R \in BOOLEAN,
    A = R
we deduce
    (ENABLED A) <=> (ENABLED R)

The premises A \in BOOLEAN, R \in BOOLEAN, and A = R must appear as separate
proof steps, and be listed in the BY statement where the proof directive
ENABLEDaxioms appears.
*)


THEOREM
    (ENABLED A) <=> (ENABLED R)
PROOF
<1>1. A \in BOOLEAN
    BY DEF A
<1>2. R \in BOOLEAN
    BY DEF R
<1>3. A = R
    BY DEF A, R
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms

--------------------------------------------------------------------------------
(* Proving that the equivalence of actions implies the equivalence of
enabledness of these actions, i.e., that from
    A <=> R
we deduce
    (ENABLED A) <=> ENABLED R

The premise A <=> R needs to appear as a separate proof step, and be listed in
the BY statement where the proof directive ENABLEDaxioms appears.
*)
THEOREM
    (ENABLED A)  <=>  ENABLED R
PROOF
<1>1. A <=> R
    BY DEF A, R
<1> QED
    BY <1>1, ENABLEDaxioms

--------------------------------------------------------------------------------
(* Proving that the implication of actions implies the implication of the
enabledness of these actions, i.e., that from
    A \in BOOLEAN,
    R \in BOOLEAN,
    A => R
we deduce
    (ENABLED A) => ENABLED R

The premises A \in BOOLEAN, R \in BOOLEAN, and A => R must appear as separate
proof steps, and be listed in the BY statement where the proof directive
ENABLEDaxioms appears.
*)
THEOREM
    (ENABLED A)  =>  ENABLED R
PROOF
<1>1. A \in BOOLEAN
    BY DEF A
<1>2. R \in BOOLEAN
    BY DEF R
<1>3. A => R
    BY DEF A, R
<1> QED
    BY <1>1, <1>2, <1>3, ENABLEDaxioms

================================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 60:5:60:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 60:5:60:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 60:8:60:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 60:8:60:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 60:14:60:18
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 60:14:60:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 60:20:60:24
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 60:20:60:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 60:26:60:39
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 60:26:60:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 49:5:49:7
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 49:5:49:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 7
    @loc: 51:5:51:7
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 51:5:51:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 8
    @loc: 58:5:58:7
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 58:5:58:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 9
    @loc: 58:8:58:21
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 58:8:58:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 58:23:58:30
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 58:23:58:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 11
    @loc: 99:5:99:7
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 99:5:99:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 12
    @loc: 99:8:99:12
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 99:8:99:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 13
    @loc: 99:14:99:18
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 99:14:99:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 14
    @loc: 99:20:99:24
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 99:20:99:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 15
    @loc: 99:26:99:39
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 99:26:99:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 16
    @loc: 85:5:85:7
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 85:5:85:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 17
    @loc: 87:5:87:7
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 87:5:87:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 18
    @loc: 97:9:97:11
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 97:9:97:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 19
    @loc: 97:12:97:16
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 97:12:97:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 20
    @loc: 95:9:95:11
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 95:9:95:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 21
    @loc: 95:12:95:25
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 95:12:95:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 22
    @loc: 95:27:95:34
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 95:27:95:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 23
    @loc: 134:5:134:7
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 134:5:134:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 24
    @loc: 134:8:134:12
    @status: to be proved

    @type: obligation
    @id: 24
    @loc: 134:8:134:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 25
    @loc: 134:14:134:18
    @status: to be proved

    @type: obligation
    @id: 25
    @loc: 134:14:134:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 26
    @loc: 134:20:134:24
    @status: to be proved

    @type: obligation
    @id: 26
    @loc: 134:20:134:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 27
    @loc: 134:26:134:39
    @status: to be proved

    @type: obligation
    @id: 27
    @loc: 134:26:134:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 28
    @loc: 122:5:122:7
    @status: to be proved

    @type: obligation
    @id: 28
    @loc: 122:5:122:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 29
    @loc: 124:5:124:7
    @status: to be proved

    @type: obligation
    @id: 29
    @loc: 124:5:124:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 30
    @loc: 132:5:132:7
    @status: to be proved

    @type: obligation
    @id: 30
    @loc: 132:5:132:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 31
    @loc: 132:8:132:21
    @status: to be proved

    @type: obligation
    @id: 31
    @loc: 132:8:132:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 32
    @loc: 132:23:132:30
    @status: to be proved

    @type: obligation
    @id: 32
    @loc: 132:23:132:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 33
    @loc: 167:5:167:7
    @status: to be proved

    @type: obligation
    @id: 33
    @loc: 167:5:167:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 34
    @loc: 167:8:167:12
    @status: to be proved

    @type: obligation
    @id: 34
    @loc: 167:8:167:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 35
    @loc: 167:14:167:18
    @status: to be proved

    @type: obligation
    @id: 35
    @loc: 167:14:167:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 36
    @loc: 167:20:167:24
    @status: to be proved

    @type: obligation
    @id: 36
    @loc: 167:20:167:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 37
    @loc: 167:26:167:39
    @status: to be proved

    @type: obligation
    @id: 37
    @loc: 167:26:167:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 38
    @loc: 155:5:155:7
    @status: to be proved

    @type: obligation
    @id: 38
    @loc: 155:5:155:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 39
    @loc: 157:5:157:7
    @status: to be proved

    @type: obligation
    @id: 39
    @loc: 157:5:157:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 40
    @loc: 165:5:165:7
    @status: to be proved

    @type: obligation
    @id: 40
    @loc: 165:5:165:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 41
    @loc: 165:8:165:21
    @status: to be proved

    @type: obligation
    @id: 41
    @loc: 165:8:165:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 42
    @loc: 165:23:165:30
    @status: to be proved

    @type: obligation
    @id: 42
    @loc: 165:23:165:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 43
    @loc: 192:5:192:7
    @status: to be proved

    @type: obligation
    @id: 43
    @loc: 192:5:192:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 44
    @loc: 192:8:192:12
    @status: to be proved

    @type: obligation
    @id: 44
    @loc: 192:8:192:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 45
    @loc: 192:14:192:18
    @status: to be proved

    @type: obligation
    @id: 45
    @loc: 192:14:192:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 46
    @loc: 192:20:192:24
    @status: to be proved

    @type: obligation
    @id: 46
    @loc: 192:20:192:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 47
    @loc: 192:26:192:39
    @status: to be proved

    @type: obligation
    @id: 47
    @loc: 192:26:192:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 48
    @loc: 181:5:181:7
    @status: to be proved

    @type: obligation
    @id: 48
    @loc: 181:5:181:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 49
    @loc: 183:5:183:7
    @status: to be proved

    @type: obligation
    @id: 49
    @loc: 183:5:183:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 50
    @loc: 190:9:190:11
    @status: to be proved

    @type: obligation
    @id: 50
    @loc: 190:9:190:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 51
    @loc: 190:12:190:16
    @status: to be proved

    @type: obligation
    @id: 51
    @loc: 190:12:190:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 52
    @loc: 190:18:190:22
    @status: to be proved

    @type: obligation
    @id: 52
    @loc: 190:18:190:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 53
    @loc: 186:9:186:11
    @status: to be proved

    @type: obligation
    @id: 53
    @loc: 186:9:186:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 54
    @loc: 186:12:186:25
    @status: to be proved

    @type: obligation
    @id: 54
    @loc: 186:12:186:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 55
    @loc: 186:27:186:34
    @status: to be proved

    @type: obligation
    @id: 55
    @loc: 186:27:186:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 56
    @loc: 188:9:188:11
    @status: to be proved

    @type: obligation
    @id: 56
    @loc: 188:9:188:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 57
    @loc: 188:12:188:25
    @status: to be proved

    @type: obligation
    @id: 57
    @loc: 188:12:188:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 58
    @loc: 188:27:188:34
    @status: to be proved

    @type: obligation
    @id: 58
    @loc: 188:27:188:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 59
    @loc: 221:5:221:7
    @status: to be proved

    @type: obligation
    @id: 59
    @loc: 221:5:221:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 60
    @loc: 221:8:221:12
    @status: to be proved

    @type: obligation
    @id: 60
    @loc: 221:8:221:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 61
    @loc: 221:14:221:18
    @status: to be proved

    @type: obligation
    @id: 61
    @loc: 221:14:221:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 62
    @loc: 221:20:221:24
    @status: to be proved

    @type: obligation
    @id: 62
    @loc: 221:20:221:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 63
    @loc: 221:26:221:39
    @status: to be proved

    @type: obligation
    @id: 63
    @loc: 221:26:221:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 64
    @loc: 210:5:210:7
    @status: to be proved

    @type: obligation
    @id: 64
    @loc: 210:5:210:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 65
    @loc: 212:5:212:7
    @status: to be proved

    @type: obligation
    @id: 65
    @loc: 212:5:212:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 66
    @loc: 219:9:219:11
    @status: to be proved

    @type: obligation
    @id: 66
    @loc: 219:9:219:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 67
    @loc: 219:12:219:16
    @status: to be proved

    @type: obligation
    @id: 67
    @loc: 219:12:219:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 68
    @loc: 219:18:219:22
    @status: to be proved

    @type: obligation
    @id: 68
    @loc: 219:18:219:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 69
    @loc: 215:9:215:11
    @status: to be proved

    @type: obligation
    @id: 69
    @loc: 215:9:215:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 70
    @loc: 215:12:215:25
    @status: to be proved

    @type: obligation
    @id: 70
    @loc: 215:12:215:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 71
    @loc: 215:27:215:34
    @status: to be proved

    @type: obligation
    @id: 71
    @loc: 215:27:215:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 72
    @loc: 217:9:217:11
    @status: to be proved

    @type: obligation
    @id: 72
    @loc: 217:9:217:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 73
    @loc: 217:12:217:25
    @status: to be proved

    @type: obligation
    @id: 73
    @loc: 217:12:217:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 74
    @loc: 217:27:217:34
    @status: to be proved

    @type: obligation
    @id: 74
    @loc: 217:27:217:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 75
    @loc: 246:5:246:7
    @status: to be proved

    @type: obligation
    @id: 75
    @loc: 246:5:246:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 76
    @loc: 246:8:246:12
    @status: to be proved

    @type: obligation
    @id: 76
    @loc: 246:8:246:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 77
    @loc: 246:14:246:18
    @status: to be proved

    @type: obligation
    @id: 77
    @loc: 246:14:246:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 78
    @loc: 246:20:246:24
    @status: to be proved

    @type: obligation
    @id: 78
    @loc: 246:20:246:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 79
    @loc: 246:26:246:39
    @status: to be proved

    @type: obligation
    @id: 79
    @loc: 246:26:246:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 80
    @loc: 240:5:240:7
    @status: to be proved

    @type: obligation
    @id: 80
    @loc: 240:5:240:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 81
    @loc: 242:5:242:7
    @status: to be proved

    @type: obligation
    @id: 81
    @loc: 242:5:242:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 82
    @loc: 244:5:244:7
    @status: to be proved

    @type: obligation
    @id: 82
    @loc: 244:5:244:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 83
    @loc: 244:8:244:21
    @status: to be proved

    @type: obligation
    @id: 83
    @loc: 244:8:244:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 84
    @loc: 244:23:244:30
    @status: to be proved

    @type: obligation
    @id: 84
    @loc: 244:23:244:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 85
    @loc: 273:5:273:7
    @status: to be proved

    @type: obligation
    @id: 85
    @loc: 273:5:273:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 86
    @loc: 273:8:273:12
    @status: to be proved

    @type: obligation
    @id: 86
    @loc: 273:8:273:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 87
    @loc: 273:14:273:18
    @status: to be proved

    @type: obligation
    @id: 87
    @loc: 273:14:273:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 88
    @loc: 273:20:273:24
    @status: to be proved

    @type: obligation
    @id: 88
    @loc: 273:20:273:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 89
    @loc: 273:26:273:39
    @status: to be proved

    @type: obligation
    @id: 89
    @loc: 273:26:273:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 90
    @loc: 267:5:267:7
    @status: to be proved

    @type: obligation
    @id: 90
    @loc: 267:5:267:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 91
    @loc: 269:5:269:7
    @status: to be proved

    @type: obligation
    @id: 91
    @loc: 269:5:269:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 92
    @loc: 271:5:271:7
    @status: to be proved

    @type: obligation
    @id: 92
    @loc: 271:5:271:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 93
    @loc: 291:5:291:7
    @status: to be proved

    @type: obligation
    @id: 93
    @loc: 291:5:291:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 94
    @loc: 291:8:291:12
    @status: to be proved

    @type: obligation
    @id: 94
    @loc: 291:8:291:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 95
    @loc: 291:14:291:27
    @status: to be proved

    @type: obligation
    @id: 95
    @loc: 291:14:291:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 96
    @loc: 289:5:289:7
    @status: to be proved

    @type: obligation
    @id: 96
    @loc: 289:5:289:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 97
    @loc: 316:5:316:7
    @status: to be proved

    @type: obligation
    @id: 97
    @loc: 316:5:316:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 98
    @loc: 316:8:316:12
    @status: to be proved

    @type: obligation
    @id: 98
    @loc: 316:8:316:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 99
    @loc: 316:14:316:18
    @status: to be proved

    @type: obligation
    @id: 99
    @loc: 316:14:316:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 100
    @loc: 316:20:316:24
    @status: to be proved

    @type: obligation
    @id: 100
    @loc: 316:20:316:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 101
    @loc: 316:26:316:39
    @status: to be proved

    @type: obligation
    @id: 101
    @loc: 316:26:316:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 102
    @loc: 310:5:310:7
    @status: to be proved

    @type: obligation
    @id: 102
    @loc: 310:5:310:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 103
    @loc: 312:5:312:7
    @status: to be proved

    @type: obligation
    @id: 103
    @loc: 312:5:312:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 104
    @loc: 314:5:314:7
    @status: to be proved

    @type: obligation
    @id: 104
    @loc: 314:5:314:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 104

    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 60, characters 5-6:
    [INFO]
    Proved pconj
    File "./ENABLEDaxioms_test.tla", line 52, character 21:
    [INFO]: Auto-expanding the definition of operator:  A
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 99, characters 5-6:
    [INFO]
    Proved pconj_inverse
    File "./ENABLEDaxioms_test.tla", line 89, character 19:
    [INFO]: Auto-expanding the definition of operator:  A
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 134, characters 5-6:
    [INFO]
    Proved abconj
    File "./ENABLEDaxioms_test.tla", line 125, character 16:
    [INFO]: Auto-expanding the definition of operator:  A
    File "./ENABLEDaxioms_test.tla", line 125, character 21:
    [INFO]: Auto-expanding the definition of operator:  B
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 167, characters 5-6:
    [INFO]
    Proved abconj_inverse
    File "./ENABLEDaxioms_test.tla", line 158, character 16:
    [INFO]: Auto-expanding the definition of operator:  A
    File "./ENABLEDaxioms_test.tla", line 158, character 31:
    [INFO]: Auto-expanding the definition of operator:  B
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 192, characters 5-6:
    [INFO]
    Proved pconj_inverse
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 221, characters 5-6:
    [INFO]
    Proved abdisj_inverse
    File "./ENABLEDaxioms_test.tla", line 214, character 19:
    [INFO]: Auto-expanding the definition of operator:  A
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 246, characters 5-6:
    [INFO]
    Proved abdisj
    File "./ENABLEDaxioms_test.tla", line 243, character 16:
    [INFO]: Auto-expanding the definition of operator:  A
    File "./ENABLEDaxioms_test.tla", line 243, character 21:
    [INFO]: Auto-expanding the definition of operator:  B
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 273, characters 5-6:
    [INFO]
    Proved equiv
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 291, characters 5-6:
    [INFO]
    Proved equiv
    expr has ENABLEDaxioms property ===
    File "./ENABLEDaxioms_test.tla", line 316, characters 5-6:
    [INFO]
    Proved implies
    File "./ENABLEDaxioms_test.tla", line 9, character 1 to line 318, character 80:
    [INFO]: All 104 obligations proved.
---*)
