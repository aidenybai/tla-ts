(*---
description: Evaluates a random set expression, seed 262, number 2978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (0 \div -1), (-1 + FALSE))), CASE ([<<5, 6>> EXCEPT ![0] = 1] = ([a |-> 1]).a) -> LET b4729 == (CHOOSE b4730 \in SUBSET {1} : FALSE) IN ([x \in 1..2 |-> x])[b4729] [] OTHER -> (Cardinality(Nat) + (1 * 3))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 74 to line 14, col 77 of module random_02978 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 72.
    | Expression starting at line 14, column 72.
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | Optional Arguments starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_02978
    | In module random_02978
    | Could not parse module random_02978 from file random_02978.tla
    | *** Errors: 1
    | In module random_02978
    | Could not parse module random_02978 from file random_02978.tla
    3002:1 Parsing or semantic analysis failed.
---*)
