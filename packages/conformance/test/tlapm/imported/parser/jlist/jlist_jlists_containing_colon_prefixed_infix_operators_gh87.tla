(*---
description: The syntax corpus case "Jlists Containing Colon-Prefixed Infix Operators (GH87)" in jlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/jlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE jlist_jlists_containing_colon_prefixed_infix_operators_gh87 ----
EXTENDS TestPrelude

conj ==
  /\ lbl :: A
  /\ B := C
  /\ D ::= E

disj ==
  \/ lbl :: A
  \/ B := C
  \/ D ::= E
====

---- MODULE TestPrelude ----
CONSTANTS A, B, C, D, E, _ := _, _ ::= _
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./jlist_jlists_containing_colon_prefixed_infix_operators_gh87.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./jlist_jlists_containing_colon_prefixed_infix_operators_gh87.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
