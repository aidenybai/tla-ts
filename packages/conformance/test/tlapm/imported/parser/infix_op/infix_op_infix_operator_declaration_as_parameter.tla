(*---
description: The syntax corpus case "Infix Operator Declaration as Parameter" in infix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/infix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE infix_op_infix_operator_declaration_as_parameter ----

op(
  _ & _,
  _ && _,
  _ \approx _,
  _ := _,
  _ \asymp _,
  _ \bigcirc _,
  _ ::= _,
  _ \bullet _,
  _ \o _,
  _ @@ _,
  _ \cong _,
  _ \div _,
  _ $ _,
  _ $$ _,
  _ \doteq _,
  _ .. _,
  _ ... _,
  _ !! _,
  _ >= _,
  _ \gg _,
  _ > _,
  _ ## _,
  _ =| _,
  _ <= _,
  _ \ll _,
  _ -| _,
  _ < _,
  _ <: _,
  _ :> _,
  _ - _,
  _ -- _,
  _ % _,
  _ %% _,
  _ * _,
  _ ** _,
  _ (.) _,
  _ (-) _,
  _ (+) _,
  _ (/) _,
  _ (\X) _,
  _ + _,
  _ ++ _,
  _ ^ _,
  _ ^^ _,
  _ \prec _,
  _ \preceq _,
  _ \propto _,
  _ ?? _,
  _ |= _,
  _ |- _,
  _ \sim _,
  _ \simeq _,
  _ / _,
  _ // _,
  _ \sqcap _,
  _ \sqcup _,
  _ \sqsubset _,
  _ \sqsubseteq _,
  _ \sqsupset _,
  _ \sqsupseteq _,
  _ \star _,
  _ \subset _,
  _ \succ _,
  _ \succeq _,
  _ \supset _,
  _ \supseteq _,
  _ \uplus _,
  _ | _,
  _ || _,
  _ \wr _
) == 1

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
