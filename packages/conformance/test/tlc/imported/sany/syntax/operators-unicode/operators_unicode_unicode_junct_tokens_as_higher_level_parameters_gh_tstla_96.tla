(*---
description: "Unicode Junct Tokens as Higher-Level Parameters (GH TSTLA #96). Ported from SANY's syntax corpus."
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/operators-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_unicode_unicode_junct_tokens_as_higher_level_parameters_gh_tstla_96 ----
op == op(∧, x, ∧)
op == op(∨, x, ∨)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 17 of module operators_unicode_unicode_junct_tokens_as_higher_level_parameters_gh_tstla_96
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 17 of module operators_unicode_unicode_junct_tokens_as_higher_level_parameters_gh_tstla_96.
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 7 to line 9, col 8 of module operators_unicode_unicode_junct_tokens_as_higher_level_parameters_gh_tstla_96
    | Unknown operator: `op'.
    | line 10, col 1 to line 10, col 17 of module operators_unicode_unicode_junct_tokens_as_higher_level_parameters_gh_tstla_96
    | Operator op already defined or declared.
    | line 10, col 9 to line 10, col 17 of module operators_unicode_unicode_junct_tokens_as_higher_level_parameters_gh_tstla_96
    | The operator op requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
