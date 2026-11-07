(*---
description: Evaluates a random seq expression, seed 262, number 9557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<(CHOOSE b14841 \in Nat : FALSE), (-2)>> \o <<(2147483647 * -1), (1 * -1)>>) \o Append(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 2], LAMBDA e : e > 0), LET b14842 == (-1 % 3) IN Cardinality({x \in 1..3 : x > 1}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 77 to line 14, col 77 of module random_09557 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | Some << -- >> or >>_ Form starting at line 14, column 63.
    | Fatal errors while parsing TLA+ spec in file random_09557
    | In module random_09557
    | Could not parse module random_09557 from file random_09557.tla
    | *** Errors: 1
    | In module random_09557
    | Could not parse module random_09557 from file random_09557.tla
    3002:1 Parsing or semantic analysis failed.
---*)
