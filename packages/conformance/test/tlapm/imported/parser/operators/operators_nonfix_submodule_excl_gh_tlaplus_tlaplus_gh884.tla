(*---
description: 'The syntax corpus case "Nonfix Submodule Excl (GH tlaplus/tlaplus #GH884)" in operators.txt, which tlapm''s parser tests read.'
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884 ----
EXTENDS TestPrelude
op == A!B!!!(x,y)
====
---- MODULE TestPrelude ----
A == INSTANCE M1
====
---- MODULE M1 ----
B == INSTANCE M2
====
---- MODULE M2 ----
x !! y == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884.tla", line 12, character 6
    incomplete expression

    @type: warning
    @msg: File "./operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884.tla", line 12, character 6

    incomplete expression

    File "./operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884.tla", line 12, character 6
    incomplete expression
    File "<unknown>":
    Error: Could not parse "./operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
