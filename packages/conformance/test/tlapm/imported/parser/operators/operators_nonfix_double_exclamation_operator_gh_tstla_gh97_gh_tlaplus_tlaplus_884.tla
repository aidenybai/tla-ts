(*---
description: 'The syntax corpus case "Nonfix Double Exclamation Operator (GH TSTLA #GH97, GH tlaplus/tlaplus #884)" in operators.txt, which tlapm''s parser tests read.'
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884 ----
op == A!!!(1,2)
op == A!B!!!(1,2)
op == A!!! !!!(1,2)
op == !! !!! !!! !!! !!!(1,2)
op == A !! B
op ==
  /\ A
  /\ B
  !! C
op ==
  /\ A
  /\ B
   !! C
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884.tla", line 11, character 6
    incomplete expression

    @type: warning
    @msg: File "./operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884.tla", line 11, character 6

    incomplete expression

    File "./operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884.tla", line 11, character 6
    incomplete expression
    File "<unknown>":
    Error: Could not parse "./operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
