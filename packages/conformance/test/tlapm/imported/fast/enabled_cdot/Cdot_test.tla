(*---
description: tlapm's own test fast/enabled_cdot/Cdot_test.tla.
ref: test/fast/enabled_cdot/Cdot_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---------------------------- MODULE Cdot_test ----------------------------------
(* Tests for the expansion of the operator \cdot. *)
(* EXTENDS TLAPS *)

(* The proof directives below are from the module `TLAPS`.
Including them here to compare the number of definitions
with when extending the module `TLAPS`.
*)

Zenon == TRUE (*{ by (prover:"zenon") }*)

ExpandENABLED == TRUE  (*{ by (prover:"expandenabled") }*)
ExpandCdot == TRUE  (*{ by (prover:"expandcdot") }*)
AutoUSE == TRUE  (*{ by (prover:"autouse") }*)


--------------------------------------------------------------------------------
(* Unit test with a single variable. *)

VARIABLE x

R == x' = TRUE

A == /\ x = FALSE
     /\ R

B == /\ x = TRUE
     /\ x' = FALSE

C == A \cdot B

D == /\ x = FALSE
     /\ x' = FALSE


(* The definitions of the operators C and D are expanded because this is
necessary to apply the proof directive ExpandCdot and prove the assertion.
The definitions of operators A and R are expanded because together they contain
a primed variable in the first argument of \cdot, which is bound by \cdot.
The definition of operator B is expanded because it contains an unprimed
variable within the second argument of \cdot, so this unprimed variable is
bound by \cdot.

The proof directive ExpandCdot converts C with A, B, and R expanded to the
expression

\E u:  /\ /\ x = FALSE
          /\ u = TRUE
       /\ /\ u = TRUE
          /\ x' = FALSE

which is equivalent to the definition of operator D.
*)
THEOREM C <=> D
PROOF
BY ExpandCdot, Zenon DEF A, B, R, C, D


(* This theorem differs from the previous one in the presence of the proof
directive AutoUSE. The definitions of the operators A, B, and R are expanded
automatically by AutoUSE, because they contain primed and unprimed variables
in the first and second arguments of the operator \cdot, respectively. These
expansions ensure sound reasoning about the operator \cdot.
*)
THEOREM C <=> D
PROOF
BY ExpandCdot, AutoUSE, Zenon DEF C, D


--------------------------------------------------------------------------------
(* Unit test with two variables. *)

VARIABLE y


A2 == /\ x = TRUE /\ y = FALSE
      /\ x' = FALSE /\ y' = TRUE

B2 == /\ x = FALSE /\ y = TRUE
      /\ x' = TRUE /\ y' = TRUE

C2 == A2 \cdot B2

D2 == /\ x = TRUE /\ y = FALSE
      /\ x' = TRUE /\ y' = TRUE


(* The definitions of the operators C2, D2 need to be expanded to prove the
assertion by making the operator \cdot visible to the proof directive
ExpandCdot and the definition of D2 visible to the Zenon backend.
The definitions of A2 and B2 need to be expanded because these operators occur
as first and second argument to \cdot, and contain primed and unprimed
variables, respectively. Application of the proof directive ExpandCdot produces
the expression

(\E r_0, r_1 :
             /\ /\ x = TRUE /\ y = FALSE
                /\ r_1 = FALSE /\ r_0 = TRUE
             /\ /\ r_1 = FALSE /\ r_0 = TRUE
                /\ x' = TRUE /\ y' = TRUE)
         <=> (/\ x = TRUE /\ y = FALSE
              /\ x' = TRUE /\ y' = TRUE)

(Internally the symbol # is used instead of underscores in the identifiers
r_0 and r_1, to avoid coincidence with identifiers defined by the user.)
*)
THEOREM C2 <=> D2
PROOF
BY ExpandCdot, Zenon DEF A2, B2, C2, D2


(* Similar to the previous theorem, with the difference that the proof
directive AutoUSE is included, which automatically expands the definitions of
the operators A2 and B2.
*)
THEOREM C2 <=> D2
PROOF
BY ExpandCdot, AutoUSE, Zenon DEF C2, D2


================================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 64:1:64:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 64:1:64:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 64:4:64:14
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 64:4:64:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 64:16:64:21
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 64:16:64:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 75:1:75:3
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 75:1:75:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 75:4:75:14
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 75:4:75:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 75:16:75:23
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 75:16:75:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 75:25:75:30
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 75:25:75:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 117:1:117:3
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 117:1:117:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 9
    @loc: 117:4:117:14
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 117:4:117:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 117:16:117:21
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 117:16:117:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 11
    @loc: 126:1:126:3
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 126:1:126:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 12
    @loc: 126:4:126:14
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 126:4:126:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 13
    @loc: 126:16:126:23
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 126:16:126:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 14
    @loc: 126:25:126:30
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 126:25:126:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 14

    File "./Cdot_test.tla", line 38, character 6:
    [INFO]: Auto-expanding the definition of operator:  A
    File "./Cdot_test.tla", line 33, character 9:
    [INFO]: Auto-expanding the definition of operator:  R
    File "./Cdot_test.tla", line 38, character 14:
    [INFO]: Auto-expanding the definition of operator:  B
    File "./Cdot_test.tla", line 90, characters 7-8:
    [INFO]: Auto-expanding the definition of operator:  A2
    File "./Cdot_test.tla", line 90, characters 16-17:
    [INFO]: Auto-expanding the definition of operator:  B2
    File "./Cdot_test.tla", line 9, character 1 to line 129, character 80:
    [INFO]: All 14 obligations proved.
---*)
