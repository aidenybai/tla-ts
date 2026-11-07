(*---
description: tlapm's own test fast/enabled_cdot/Enabled_test.tla.
ref: test/fast/enabled_cdot/Enabled_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---------------------------- MODULE Enabled_test -------------------------------
(* Unit tests for expanding `ENABLED`. *)
EXTENDS TLAPS


(* This statement declares three variables. *)
VARIABLE x, y, z


P(u) == u'  (* An operator that primes its argument. *)
Q == y  (* An operator that equals an unprimed variable. *)
R == x'  (* An operator that equals a primed variable. *)


(* The proof directive ExpandENABLED translates ENABLED x to x .
The formula x = TRUE implies x, hence x = TRUE implies ENABLED x .
*)
THEOREM
    (x = TRUE)  =>  ENABLED x
PROOF
    BY ExpandENABLED


(* The proof directive ExpandENABLED translates ENABLED (x') to \E u:  u .
The formula \E u:  u is equivalent to TRUE.
*)
THEOREM
    ENABLED (x')
PROOF
    BY ExpandENABLED


(* Reasoning about the expression ENABLED R requires expanding all defined
operators that contain primed variables. The operator R contains the expression
x', which is a primed variable. So we expand R in the BY statement.
The expansion of R happens first, producing the expression ENABLED (x') .
The proof directive ExpandENABLED then translates the expression ENABLED (x')
to \E u:  u .
*)
THEOREM
    ENABLED R
PROOF
    BY ExpandENABLED DEF R


(* Instead of listing R in the statement BY ExpandENABLED DEF R, we can write
the proof directive AutoUSE. This tells TLAPS to expand all defined operators
that need to be expanded in order to reason soundly about ENABLED.
In this case the definition of R contains the expression x', which requires
expansion for ensuring soundness, so R is automatically expanded.
*)
THEOREM
    ENABLED R
PROOF
    BY ExpandENABLED, AutoUSE


(* The expression P(x) expands to x'. This is a primed variable, so P(x) needs
to be expanded before converting the operator ENABLED to existential
quantification. The expansion of P is listed here in the statement
BY ExpandENABLED DEF P and produces the expression ENABLED (x'),
which ExpandENABLED converts to \E u:  u .
*)
THEOREM
    ENABLED P(x)
PROOF
    BY ExpandENABLED DEF P


(* The need to expand the definition of operator P is detected automatically
when using the proof directive AutoUSE. An explicit expansion of P is
unnecessary. The expression ENABLED P(x) is first converted to ENABLED (x'),
and then converted to \E u:  u by the proof directive ExpandENABLED.
*)
THEOREM
    ENABLED P(x)
PROOF
    BY ExpandENABLED, AutoUSE


(* The definition of operator Q contains an unprimed variable, which does not
need to be expanded to soundly reason about ENABLED. So we list only operator
P in the BY DEF statement (because P(x) contains the primed variable x').

The expansion of P happens first, producing the expression ENABLED (x' \/ Q).
This expression is then converted to the expression \E u:  (u \/ Q) by the
proof directive ExpandENABLED.
*)
THEOREM
    ENABLED (P(x) \/ Q)
PROOF
    BY ExpandENABLED DEF P


(* Similarly to the previous example, the definition of operator P needs to be
expanded, unlike the definition of Q, because P(x) contains the primed variable
x' and Q does not contain primed variables. The necessary expansion (of P)
is performed by the proof directive AutoUSE, to yield the expression
ENABLED (x' \/ Q). ExpandENABLED converts this expression to \E u:  (u \/ Q).
*)
THEOREM
    ENABLED (P(x) \/ Q)
PROOF
    BY ExpandENABLED, AutoUSE

--------------------------------------------------------------------------------

Yunprimed == y
F == ENABLED (z' /\ Yunprimed)
G == /\ Yunprimed
     /\ \E zprime:  zprime


(* A proof that expands also Yunprimed, even though this expansion is
unnecessary for ensuring soundness.
*)
THEOREM EnabledEliminationWithUnexpanded ==
    F = G
PROOF
    BY ExpandENABLED DEF F, G, Yunprimed
    (* This proof is sound with the operator Yunprimed expanded or not. *)


(* The definition of operator F needs to be explicitly expanded, so that the
occurrence of the operator ENABLED become visible to the proof directive
ExpandENABLED. The definition of the operator G needs to be expanded to prove
the equivalence.
*)
THEOREM
    F = G
PROOF
    BY ExpandENABLED DEF F, G


--------------------------------------------------------------------------------

(* The operator Yunprimed needs to be expanded in this example to prove the
equivalence. AutoUSE would not do so, because Yunprimed does not contain any
primed variables.
*)
THEOREM
   ASSUME
       NEW A,
       A <=> ENABLED Yunprimed
   PROVE
       A <=> ENABLED (z' /\ y)
PROOF
    BY ExpandENABLED DEF Yunprimed

--------------------------------------------------------------------------------

A == (x \in BOOLEAN) /\ (x' = ~ x)  (* An action. *)
B == ENABLED (x \in BOOLEAN /\ << A >>_x)  (* An ENABLED expression defined
    using the action A. *)
BwithAexpanded ==
    ENABLED /\ x \in BOOLEAN
            /\ x' = ~ x
            /\ x' # x  (* An action that is equivalent to B with the definition
                of action A expanded. *)

(* The definitions of both A and B need to be expanded to prove this
implication.
*)
THEOREM
    A => B
PROOF
    BY ExpandENABLED DEF A, B


(* Listing A and B in the BY DEF statement is still needed in thise case
even if AutoUSE is present, because the occurrence of A as the first argument
to the implication => is not in the scope of an ENABLED, so it would not be
expanded by AutoUSE, and the occurrence of B also is not in the scope of an
ENABLED. The definition of B contains an ENABLED, but this is not a reason for
AutoUSE to expand B.

The proof directive AutoUSE would expand the occurrence of action A within
the definition of B, because it is an action in the scope of ENABLED.
However, this expansion of A is performed due to listing A in the BY DEF
statement, before the proof directive AutoUSE is applied.
*)
THEOREM
    A => B
PROOF
    BY ExpandENABLED, AutoUSE DEF A, B


(* Here the operators B and BwithAexpanded need to be explicitly expanded
to prove the equivalence, and the operator A needs to be expanded to ensure
soundness, because A is an action that occurs within the scope of ENABLED in
the definition of B.
*)
THEOREM
    B <=> BwithAexpanded
PROOF
    BY ExpandENABLED DEF A, B, BwithAexpanded


(* By including the proof directive AutoUSE, the operator A need not be
explicitly expanded. The expansion of A within the definition of B is performed
automatically by the proof directive AutoUSE, and then ExpandENABLED converts
the assertion to (\E u:  x \in BOOLEAN /\ x \in BOOLEAN /\ u = ~ x /\ u # x)
<=> (\E u:  x \in BOOLEAN /\ u = ~ x /\ u # x) .
*)
THEOREM
    B <=> BwithAexpanded
PROOF
    BY ExpandENABLED, AutoUSE DEF B, BwithAexpanded

--------------------------------------------------------------------------------

(* This theorem is proved by applying the proof directive ExpandENABLED,
which converts the assertion to (\E u:  y /\ u) = (\E u:  u /\ y).
*)
THEOREM
    (ENABLED (y /\ x')) = ENABLED (x' /\ y)
PROOF
    BY ExpandENABLED

--------------------------------------------------------------------------------

C == x' = x  (* An operator that expresses that x remains unchanged. *)
D == ENABLED C  (* A state predicate that describes the states from where x
    can remain unchanged. *)


(* The operator D is expanded by listing D in the BY DEF statement, because the
definition of D contains an occurrence of ENABLED. The expansion of D makes the
ENABLED visible to the proof directive AutoUSE, which expands the operator C,
because C is an action that occurs in the scope of ENABLED within the
definition of operator D. After these expansions take place, the proof
directive ExpandENABLED converts the expression ENABLED (x' = x) to the
expression \E u:  (u' = x), which is equivalent to TRUE.
*)
THEOREM
    D
PROOF
    BY ExpandENABLED, AutoUSE DEF D


--------------------------------------------------------------------------------

(* The first ENABLED expression is parsed as (ENABLED y) /\ x', which is
equivalent to y /\ x', which implies ENABLED (y /\ x'), because the latter is
equivalent to \E u:  y /\ u .
*)
THEOREM
    (ENABLED y /\ x') => ENABLED (y /\ x')
PROOF
    BY ExpandENABLED


(* These two ENABLED expressions are equivalent, as proved by applying the
proof directive ExpandENABLED. For this reason, it is useful to include
parentheses around the argument of ENABLED if it is an expression that contains
operators.
*)
THEOREM
    ((ENABLED y) /\ x')  <=>  ENABLED y /\ x'
PROOF
    BY ExpandENABLED

================================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 29:5:29:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 29:5:29:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 29:8:29:21
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 29:8:29:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 38:5:38:7
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 38:5:38:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 4
    @loc: 38:8:38:21
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 38:8:38:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 51:5:51:7
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 51:5:51:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 6
    @loc: 51:8:51:21
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 51:8:51:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 63:5:63:7
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 63:5:63:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 8
    @loc: 63:8:63:21
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 63:8:63:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 63:23:63:30
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 63:23:63:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 75:5:75:7
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 75:5:75:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 11
    @loc: 75:8:75:21
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 75:8:75:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 12
    @loc: 86:5:86:7
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 86:5:86:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 13
    @loc: 86:8:86:21
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 86:8:86:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 14
    @loc: 86:23:86:30
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 86:23:86:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 15
    @loc: 100:5:100:7
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 100:5:100:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 16
    @loc: 100:8:100:21
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 100:8:100:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 17
    @loc: 112:5:112:7
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 112:5:112:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 18
    @loc: 112:8:112:21
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 112:8:112:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 19
    @loc: 112:23:112:30
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 112:23:112:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 20
    @loc: 128:5:128:7
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 128:5:128:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 21
    @loc: 128:8:128:21
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 128:8:128:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 22
    @loc: 140:5:140:7
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 140:5:140:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 23
    @loc: 140:8:140:21
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 140:8:140:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 24
    @loc: 156:5:156:7
    @status: to be proved

    @type: obligation
    @id: 24
    @loc: 156:5:156:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 25
    @loc: 156:8:156:21
    @status: to be proved

    @type: obligation
    @id: 25
    @loc: 156:8:156:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 26
    @loc: 175:5:175:7
    @status: to be proved

    @type: obligation
    @id: 26
    @loc: 175:5:175:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 27
    @loc: 175:8:175:21
    @status: to be proved

    @type: obligation
    @id: 27
    @loc: 175:8:175:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 28
    @loc: 193:5:193:7
    @status: to be proved

    @type: obligation
    @id: 28
    @loc: 193:5:193:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 29
    @loc: 193:8:193:21
    @status: to be proved

    @type: obligation
    @id: 29
    @loc: 193:8:193:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 30
    @loc: 193:23:193:30
    @status: to be proved

    @type: obligation
    @id: 30
    @loc: 193:23:193:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 31
    @loc: 204:5:204:7
    @status: to be proved

    @type: obligation
    @id: 31
    @loc: 204:5:204:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 32
    @loc: 204:8:204:21
    @status: to be proved

    @type: obligation
    @id: 32
    @loc: 204:8:204:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 33
    @loc: 216:5:216:7
    @status: to be proved

    @type: obligation
    @id: 33
    @loc: 216:5:216:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 34
    @loc: 216:8:216:21
    @status: to be proved

    @type: obligation
    @id: 34
    @loc: 216:8:216:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 35
    @loc: 216:23:216:30
    @status: to be proved

    @type: obligation
    @id: 35
    @loc: 216:23:216:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 36
    @loc: 226:5:226:7
    @status: to be proved

    @type: obligation
    @id: 36
    @loc: 226:5:226:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 37
    @loc: 226:8:226:21
    @status: to be proved

    @type: obligation
    @id: 37
    @loc: 226:8:226:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 38
    @loc: 246:5:246:7
    @status: to be proved

    @type: obligation
    @id: 38
    @loc: 246:5:246:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 39
    @loc: 246:8:246:21
    @status: to be proved

    @type: obligation
    @id: 39
    @loc: 246:8:246:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 40
    @loc: 246:23:246:30
    @status: to be proved

    @type: obligation
    @id: 40
    @loc: 246:23:246:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 41
    @loc: 258:5:258:7
    @status: to be proved

    @type: obligation
    @id: 41
    @loc: 258:5:258:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 42
    @loc: 258:8:258:21
    @status: to be proved

    @type: obligation
    @id: 42
    @loc: 258:8:258:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 43
    @loc: 269:5:269:7
    @status: to be proved

    @type: obligation
    @id: 43
    @loc: 269:5:269:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 44
    @loc: 269:8:269:21
    @status: to be proved

    @type: obligation
    @id: 44
    @loc: 269:8:269:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 44

    File "./Enabled_test.tla", line 61, character 13:
    [INFO]: Auto-expanding the definition of operator:  R
    File "./Enabled_test.tla", line 84, characters 13-16:
    [INFO]: Auto-expanding the definition of operator:  P
    File "./Enabled_test.tla", line 110, characters 14-17:
    [INFO]: Auto-expanding the definition of operator:  P
    File "./Enabled_test.tla", line 161, character 35:
    [INFO]: Auto-expanding the definition of operator:  A
    File "./Enabled_test.tla", line 231, character 14:
    [INFO]: Auto-expanding the definition of operator:  C
    File "./Enabled_test.tla", line 9, character 1 to line 271, character 80:
    [INFO]: All 44 obligations proved.
---*)
