(*---
description: SANY reports E4246. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4246_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
This one is a bit confusing. Basically when higher-order operators are used,
the level-checker needs to determine the max/min levels of arguments they can
accept. It does this by looking at how the higher-order operators are used.
In this case, F(_) is used with an action-level argument of F(0'). This means
any operator provided in place of F when calling op must be able to accept an
action-level argument. While we are used to upper bounds when dealing with
level-checking, this is a lower bound on an upper bound, which is a bit odd.
So when op(') is called, since the ' operator cannot accept an action-level
argument, it fails to meet F's lower bound on the argument's upper bound,
thus producing a level-checking error. This correctly prevents what would
otherwise allow us to double-prime an expression.
---- MODULE E4246_Test ----
---- MODULE Inner ----
CONSTANT F(_)
op == F(0')
====
INSTANCE Inner WITH F <- '
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 24, col 1 to line 24, col 26 of module E4246_Test
    | Level error in instantiating module 'Inner':
    | The level of the expression or operator substituted for 'F' 
    | must be at most 0.
    | line 24, col 1 to line 24, col 26 of module E4246_Test
    | Error in instantiating module 'Inner':
    |  A non-Leibniz operator substituted for 'F'.
    | line 24, col 1 to line 24, col 26 of module E4246_Test
    | Level error in instantiating module 'Inner':
    | The level of the argument 1 of the operator ' 
    | must be at least 2.
    3002:1 Parsing or semantic analysis failed.
---*)
