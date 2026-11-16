(*---
description: 'The syntax corpus case "Conjunct Inside Ambiguous Case (GH tlaplus/tlaplus #487)" in case.txt, which tlapm''s parser tests read.'
ref: test/parser/syntax_corpus/case.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE case_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487 ----
EXTENDS TestPrelude
op ==
  CASE A ->
    /\ CASE B -> C
       [] D -> E
  [] F -> G

op2 ==
  CASE H ->
    /\ CASE I -> J
       [] OTHER -> K
  [] L -> M

op3 ==
  CASE N ->
    /\ CASE O -> P
       [] Q -> R
    /\ S
  [] T -> U
====
---- MODULE TestPrelude ----
A == 1
B == 2
C == 3
D == 4
E == 5
F == 6
G == 7
H == 8
I == 9
J == 10
K == 11
L == 12
M == 13
N == 14
O == 15
P == 16
Q == 17
R == 18
S == 19
T == 20
U == 21
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./case_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./case_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
