// Ported from Zenon's mlproof.ml, as shipped in tlapm. Copyright 2004 INRIA, see LICENSE.
//
// The proofs that the search builds and the checker reads. Each rule takes a fixed number of
// arguments, or at least a fixed number, so a rule application can't have the wrong arity. The
// rules of the TLA+ extension, Zenon's Ext, sit beside the core rules: their names don't clash.

import type { Expr } from "./expr";
import type { Definition } from "./parse";

type Two<Term> = [Term, Term];
type Three<Term> = [Term, Term, Term];
type Four<Term> = [Term, Term, Term, Term];
type Five<Term> = [Term, Term, Term, Term, Term];
type Six<Term> = [Term, Term, Term, Term, Term, Term];
type Seven<Term> = [Term, Term, Term, Term, Term, Term, Term];

// The arguments of each rule that names neither a relation nor a definition.
interface PlainRuleArgs<Term> {
  close: [Term];
  false: [];
  not_true: [];
  conj_tree: [Term];
  disj_tree: [Term];
  and: Two<Term>;
  not_not: [Term];
  not_or: Two<Term>;
  not_impl: Two<Term>;
  or: Two<Term>;
  impl: Two<Term>;
  equiv: Two<Term>;
  not_and: Two<Term>;
  not_equiv: Two<Term>;
  ex: [Term];
  not_all_ex: [Term];
  all: Two<Term>;
  not_ex: Two<Term>;
  not_equal: Two<Term>;
  p_not_p: Two<Term>;
  trans: Two<Term>;
  trans_sym: Two<Term>;
  trans_eq: Three<Term>;
  trans_eq_sym: Three<Term>;
  trans_eq2: Three<Term>;
  cut: [Term];
  congruence_lr: Three<Term>;
  congruence_rl: Three<Term>;
  stringequal: Two<Term>;
  stringdiffll: Four<Term>;
  stringdifflr: Four<Term>;
  stringdiffrl: Four<Term>;
  stringdiffrr: Four<Term>;
  eq_x_true: Three<Term>;
  eq_true_x: Three<Term>;
  noteq_x_true: Three<Term>;
  noteq_true_x: Three<Term>;
  eq_x_false: Three<Term>;
  eq_false_x: Three<Term>;
  in_emptyset: Two<Term>;
  in_upair: Six<Term>;
  notin_upair: Six<Term>;
  in_addElt: Three<Term>;
  notin_addElt: Three<Term>;
  in_set: Three<Term>;
  notin_set: Three<Term>;
  in_SUBSET: Four<Term>;
  notin_SUBSET: Four<Term>;
  in_UNION: Four<Term>;
  notin_UNION: Four<Term>;
  in_cup: Six<Term>;
  notin_cup: Six<Term>;
  in_cap: Six<Term>;
  notin_cap: Six<Term>;
  in_setminus: Six<Term>;
  notin_setminus: Six<Term>;
  in_subsetof: Six<Term>;
  notin_subsetof: Six<Term>;
  in_setofall: Five<Term>;
  notin_setofall: Five<Term>;
  in_funcset: Seven<Term>;
  notin_funcset: Seven<Term>;
  except_notin_funcset: [Term, Term, Term, Term, Term, Term, Term, Term];
  setequalempty: Three<Term>;
  setemptyequal: Three<Term>;
  setequal: Four<Term>;
  notsetequal: Four<Term>;
  notisafcn_fcn: Three<Term>;
  notisafcn_except: Four<Term>;
  notisafcn_onearg: Three<Term>;
  notisafcn_extend: Three<Term>;
  funequal: Four<Term>;
  notfunequal: Four<Term>;
  choose_diff_choose: Four<Term>;
  notequivdef: [];
  notequalchoose: Five<Term>;
  in_nat_0: [Term];
  in_nat_succ: Three<Term>;
  box_p: Two<Term>;
  tuple_eq_match: [Term, ...Term[]];
  tuple_eq_mismatch: Two<Term>;
  in_product: [Term, Term, Term, Term, Term, ...Term[]];
  notin_product: [Term, Term, Term, ...Term[]];
  tuple_notisaseq: [Term];
  record_eq_match: [Term, ...Term[]];
  record_eq_mismatch: Two<Term>;
  record_neq_match: [Term, ...Term[]];
  neq_record: [Term, Term, Term, ...Term[]];
  record_neq: [Term, Term, Term, ...Term[]];
  in_recordset: [Term, Term, Term, ...Term[]];
  notin_recordset: [Term, Term, Term, ...Term[]];
  record_notisafcn: [Term];
  cup_subseteq: Three<Term>;
  not_cup_subseteq: Three<Term>;
  subseteq_cap: Three<Term>;
  not_subseteq_cap: Three<Term>;
  all_in: Five<Term>;
  notex_in: Five<Term>;
  p_eq_l: Seven<Term>;
  p_eq_r: Seven<Term>;
  np_eq_l: Seven<Term>;
  np_eq_r: Seven<Term>;
  trueistrue: Five<Term>;
  fapplyfcn: Seven<Term>;
  fapplyexcept: [Term, Term, Term, Term, Term, Term, Term, Term, Term, Term, Term, Term, Term];
  tuple_access: Five<Term>;
  record_access: Five<Term>;
  domain_fcn: Five<Term>;
  domain_except: Six<Term>;
  record_domain: Five<Term>;
  boolcase_not: Seven<Term>;
  boolcase_and: [Term, Term, Term, Term, Term, Term, Term, Term];
  boolcase_or: [Term, Term, Term, Term, Term, Term, Term, Term];
  boolcase_imply: [Term, Term, Term, Term, Term, Term, Term, Term];
  boolcase_equiv: [Term, Term, Term, Term, Term, Term, Term, Term];
  boolcase_equal: [Term, Term, Term, Term, Term, Term, Term, Term];
  boolcase_all: Seven<Term>;
  boolcase_ex: Seven<Term>;
  iftrue: Five<Term>;
  iffalse: Five<Term>;
  ifthenelse: [Term, Term, Term, Term, Term, Term, Term, Term, Term];
  case: [Term, Term, ...Term[]];
  tuple_len: Five<Term>;
}

// The rules that hold for any relation that the hypotheses make reflexive or symmetric.
interface RelationRuleArgs<Term> {
  close_refl: [Term];
  close_sym: Two<Term>;
  refl: Two<Term>;
  p_not_p_sym: Two<Term>;
}

export type PlainRuleName = keyof PlainRuleArgs<Expr>;

export type RelationRuleName = keyof RelationRuleArgs<Expr>;

export type RuleArgs<Name extends PlainRuleName, Term = Expr> = PlainRuleArgs<Term>[Name];

type PlainRules<Term> = {
  [Name in keyof PlainRuleArgs<Term>]: { name: Name; args: PlainRuleArgs<Term>[Name] };
};

type RelationRules<Term> = {
  [Name in keyof RelationRuleArgs<Term>]: {
    name: Name;
    relation: string;
    args: RelationRuleArgs<Term>[Name];
  };
};

// A rule application, as in Zenon's Mlproof.rule. "definition" unfolds `definition`.
export type Rule<Term = Expr> =
  | PlainRules<Term>[PlainRuleName]
  | RelationRules<Term>[RelationRuleName]
  | { name: "definition"; definition: Definition; args: Two<Term> };

// A proof of the formulas in `conclusions`: the node's rule applied to `uses`, with a subproof for
// each of its branches.
export interface Proof<Term = Expr> {
  conclusions: Term[];
  rule: Rule<Term>;
  uses: Term[];
  subproofs: Proof<Term>[];
}

export const makeRule = <Name extends PlainRuleName>(
  name: Name,
  args: PlainRuleArgs<Expr>[Name],
): { name: Name; args: PlainRuleArgs<Expr>[Name] } => ({ name, args });

export const makeRelationRule = <Name extends RelationRuleName>(
  name: Name,
  relation: string,
  args: RelationRuleArgs<Expr>[Name],
): { name: Name; relation: string; args: RelationRuleArgs<Expr>[Name] } => ({
  name,
  relation,
  args,
});
