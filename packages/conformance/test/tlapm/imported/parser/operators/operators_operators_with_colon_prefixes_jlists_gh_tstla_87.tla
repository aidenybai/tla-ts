(*---
description: 'The syntax corpus case "Operators with Colon Prefixes & Jlists (GH TSTLA #87)" in operators.txt, which tlapm''s parser tests read.'
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_operators_with_colon_prefixes_jlists_gh_tstla_87 ----
EXTENDS TestPrelude
op ==
  /\ A :> B
  /\ A := B
  /\ A ::= B
  /\ A :: B
  /\ A
====
---- MODULE TestPrelude ----
VARIABLES A, B
CONSTANTS _ :> _, _ := _, _ ::= _
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_operators_with_colon_prefixes_jlists_gh_tstla_87.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./operators_operators_with_colon_prefixes_jlists_gh_tstla_87.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
