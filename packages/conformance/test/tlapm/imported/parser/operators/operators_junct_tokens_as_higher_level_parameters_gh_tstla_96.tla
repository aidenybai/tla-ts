(*---
description: 'The syntax corpus case "Junct Tokens as Higher-Level Parameters (GH TSTLA #96)" in operators.txt, which tlapm''s parser tests read.'
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_junct_tokens_as_higher_level_parameters_gh_tstla_96 ----
EXTENDS TestPrelude
op1 == op(/\, x, /\)
op2 == op(\/, x, \/)
====
---- MODULE TestPrelude ----
VARIABLE x
op(a(_, _), b, c(_, _)) == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_junct_tokens_as_higher_level_parameters_gh_tstla_96.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./operators_junct_tokens_as_higher_level_parameters_gh_tstla_96.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
