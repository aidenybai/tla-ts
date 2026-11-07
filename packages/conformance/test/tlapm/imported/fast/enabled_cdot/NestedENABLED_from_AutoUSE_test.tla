(*---
description: tlapm's own test fast/enabled_cdot/NestedENABLED_from_AutoUSE_test.tla.
ref: test/fast/enabled_cdot/NestedENABLED_from_AutoUSE_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
--------------------- MODULE NestedENABLED_from_AutoUSE_test -------------------
(* Test for multiply nested `ENABLED` with definitions that need expansion. *)
EXTENDS TLAPS


VARIABLE x


A == ENABLED (x /\ x')
B == ENABLED (x /\ A')
C == ENABLED (x /\ B')
D == ENABLED (x /\ C')
E == ENABLED (x /\ D')
F == ENABLED (x /\ E')
G == ENABLED (x /\ F')
H == ENABLED (x /\ G')
I == ENABLED (x /\ H')
J == ENABLED (x /\ I')


(* In this example the definitions of operators A, B, C, D, E, F, G, H, I, J
are expanded automatically because they contain primed variables in the scope
of ENABLED. For example, the operator A that occurs primed in B contains the
variable x, which is primed within the scope of ENABLED, so A is expanded
within B. In more detail, the expansions are performed because A is a state
level expression (ENABLED has this expression level) that occurs primed in
the scope of ENABLED, so it could (and does) contain variables in the scope of
a prime within the scope of ENABLED.

After AutoUSE and ExpandENABLED are applied, the resulting expression is

\E r_0 :
    \E r_0_1 :
       r_0
       /\ (\E r_0_2 :
              r_0_1
              /\ (\E r_0_3 :
                     r_0_2
                     /\ (\E r_0_4 :
                            r_0_3
                            /\ (\E r_0_5 :
                                   r_0_4
                                   /\ (\E r_0_6 :
                                          r_0_5
                                          /\ (\E r_0_7 :
                                                 r_0_6
                                                 /\ (\E r_0_8 :
                                                        r_0_7
                                                        /\ (\E r_0_9 :
                                                            r_0_8
                                                            /\ (
                                                            \E r_0_10 :
                                                            r_0_9
                                                            /\ r_0_10)))))))))

(Internally the bound constants are named with the symbol # in the identifier,
for example r#0_1, to avoid coincidence with identifiers defined by the user.)
*)
THEOREM
    ENABLED (J')
PROOF
BY ExpandENABLED, Isa, AutoUSE


================================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 70:1:70:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 70:1:70:3
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 70:4:70:17
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 70:4:70:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 70:19:70:22
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 70:19:70:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 70:24:70:31
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 70:24:70:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    File "./NestedENABLED_from_AutoUSE_test.tla", line 68, character 14:
    [INFO]: Auto-expanding the definition of operator:  J
    File "./NestedENABLED_from_AutoUSE_test.tla", line 26, character 20:
    [INFO]: Auto-expanding the definition of operator:  I
    File "./NestedENABLED_from_AutoUSE_test.tla", line 25, character 20:
    [INFO]: Auto-expanding the definition of operator:  H
    File "./NestedENABLED_from_AutoUSE_test.tla", line 24, character 20:
    [INFO]: Auto-expanding the definition of operator:  G
    File "./NestedENABLED_from_AutoUSE_test.tla", line 23, character 20:
    [INFO]: Auto-expanding the definition of operator:  F
    File "./NestedENABLED_from_AutoUSE_test.tla", line 22, character 20:
    [INFO]: Auto-expanding the definition of operator:  E
    File "./NestedENABLED_from_AutoUSE_test.tla", line 21, character 20:
    [INFO]: Auto-expanding the definition of operator:  D
    File "./NestedENABLED_from_AutoUSE_test.tla", line 20, character 20:
    [INFO]: Auto-expanding the definition of operator:  C
    File "./NestedENABLED_from_AutoUSE_test.tla", line 19, character 20:
    [INFO]: Auto-expanding the definition of operator:  B
    File "./NestedENABLED_from_AutoUSE_test.tla", line 18, character 20:
    [INFO]: Auto-expanding the definition of operator:  A
    File "./NestedENABLED_from_AutoUSE_test.tla", line 9, character 1 to line 73, character 80:
    [INFO]: All 4 obligations proved.
---*)
