(*---
description: Evaluates a random record expression, seed 262, number 8692.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08692 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (Len(<<3, 1, 2>>) \div (2 % 7)), b |-> ((2147483647 \in SUBSET {1}) = CASE FALSE -> 7 [] OTHER -> 2)] EXCEPT !.a = @ + Len(<<(CHOOSE r \in [a : {0} \cup {1}] : TRUE), (2 \div -1)>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 194 to line 14, col 197 of module random_08692 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 192.
    | Expression starting at line 14, column 192.
    | ExtendableExpr starting at line 14, column 191.
    | Expression starting at line 14, column 191.
    | Some << -- >> or >>_ Form starting at line 14, column 147.
    | Fatal errors while parsing TLA+ spec in file random_08692
    | In module random_08692
    | Could not parse module random_08692 from file random_08692.tla
    | *** Errors: 1
    | In module random_08692
    | Could not parse module random_08692 from file random_08692.tla
    3002:1 Parsing or semantic analysis failed.
---*)
