// Ported from Zenon's isar_case.ml and enum.ml, as shipped in tlapm. Copyright 2009 INRIA, see
// LICENSE.
//
// The lemmas for CASE expressions and record sets with more arms or fields than Zenon.thy covers.
// Each one is a template that Zenon's Enum expands for the arity: the text between @@@ and ...
// repeats counting up, the text between ... and @@@ repeats counting down.

import { TlaZenonError } from "../../errors";

// A run of digits or of other characters.
interface Lexeme {
  isNumber: boolean;
  text: string;
}

// A piece of a pattern: text, or a number that grows by its step at each repetition.
type Piece = string | { base: number; step: number };

interface Pattern {
  pieces: Piece[];
  separator: string;
}

const isDigit = (char: string | undefined) => char !== undefined && char >= "0" && char <= "9";

const lex = (text: string): Lexeme[] =>
  text.match(/[0-9]+|[^0-9]+/g)?.map((run) => ({ isNumber: isDigit(run[0]), text: run })) ?? [];

// The repeated text and the separator of a pattern without numbers: its two equal halves.
const splitText = (text: string): Pattern => {
  const half = Math.floor(text.length / 2);
  const odd = text.length % 2;
  for (let offset = 0; offset < half; offset++) {
    const first = text.slice(0, half - offset);
    if (first === text.slice(half + offset + odd, half + offset + odd + half - offset))
      return { pieces: [first], separator: text.slice(half - offset, half + offset + odd) };
  }
  return { pieces: [], separator: text };
};

const correlate = (first: Lexeme[], second: Lexeme[]): Piece[] | undefined => {
  if (first.length !== second.length) throw new TlaZenonError("Zenon: an uneven template");
  const pieces = first.map((lexeme, position): Piece | undefined => {
    const other = second[position];
    if (!lexeme.isNumber && !other.isNumber && lexeme.text === other.text) return lexeme.text;
    if (lexeme.isNumber && other.isNumber)
      return { base: Number(lexeme.text), step: Number(other.text) - Number(lexeme.text) };
    return undefined;
  });
  return pieces.every((piece) => piece !== undefined) ? pieces : undefined;
};

// Zenon's split_sep: the separator inside the middle text, after the end of the first instance's
// last lexeme and before the start of the second instance's first.
const splitSeparator = (
  before: Lexeme,
  middle: string,
  after: Lexeme,
): [Lexeme[], string, Lexeme[]] | undefined => {
  if (!before.isNumber && !middle.startsWith(before.text)) return undefined;
  if (!after.isNumber && !middle.endsWith(after.text)) return undefined;
  const start = before.isNumber ? 0 : before.text.length;
  const end = after.isNumber ? 0 : after.text.length;
  if (start + end > middle.length) return undefined;
  return [
    before.isNumber ? [] : [before],
    middle.slice(start, middle.length - end),
    after.isNumber ? [] : [after],
  ];
};

// Zenon's split_sep2, for two instances that meet between two numbers.
const splitSeparatorBetween = (
  before: Lexeme,
  first: Lexeme,
  second: Lexeme,
  after: Lexeme,
): [Lexeme[], string, Lexeme[]] => {
  if (
    !before.isNumber &&
    !first.isNumber &&
    second.isNumber &&
    after.isNumber &&
    first.text.startsWith(before.text)
  )
    return [[before], first.text.slice(before.text.length), [second]];
  if (
    before.isNumber &&
    first.isNumber &&
    !second.isNumber &&
    !after.isNumber &&
    second.text.endsWith(after.text)
  )
    return [[first], second.text.slice(0, second.text.length - after.text.length), [after]];
  throw new TlaZenonError("Zenon: a template whose instances don't meet");
};

// Zenon's Enum.parse: a template's text holds two instances of the pattern and the separator.
const parsePattern = (text: string): Pattern | undefined => {
  const lexemes = lex(text);
  const length = lexemes.length;
  if (length === 0) return { pieces: [], separator: "" };
  if (length === 1) {
    const only = lexemes[0];
    if (!only.isNumber) return splitText(only.text);
    if (only.text.length % 2 === 1) return undefined;
    const half = only.text.length / 2;
    const base = Number(only.text.slice(0, half));
    return { pieces: [{ base, step: Number(only.text.slice(half)) - base }], separator: "" };
  }
  const half = Math.floor(length / 2);
  if (length % 4 === 0) {
    const prefix = lexemes.slice(0, half - 1);
    const suffix = lexemes.slice(half + 1);
    const split = splitSeparatorBetween(
      suffix[suffix.length - 1],
      lexemes[half - 1],
      lexemes[half],
      prefix[0],
    );
    const pieces = correlate([...prefix, ...split[0]], [...split[2], ...suffix]);
    return pieces === undefined ? undefined : { pieces, separator: split[1] };
  }
  if (length % 2 === 0) return undefined;
  const middle = lexemes[half];
  if (middle.isNumber) return undefined;
  const prefix = lexemes.slice(0, half);
  const suffix = lexemes.slice(half + 1);
  const split = splitSeparator(suffix[suffix.length - 1], middle.text, prefix[0]);
  if (split === undefined) return undefined;
  const pieces = correlate([...prefix, ...split[0]], [...split[2], ...suffix]);
  return pieces === undefined ? undefined : { pieces, separator: split[1] };
};

const getInstance = (pieces: Piece[], value: (piece: { base: number; step: number }) => number) =>
  pieces.map((piece) => (typeof piece === "string" ? piece : String(value(piece)))).join("");

// Zenon's expand_string and expand_string_rev: the pattern repeated count times.
const expandPattern = (count: number, text: string, isReversed: boolean) => {
  const pattern = parsePattern(text);
  if (pattern === undefined) return undefined;
  const positions = Array.from({ length: count }, (_, position) =>
    isReversed ? count - 1 - position : position,
  );
  return positions
    .map((position) =>
      getInstance(pattern.pieces, (piece) =>
        isReversed
          ? piece.base + piece.step - position * piece.step
          : piece.base + position * piece.step,
      ),
    )
    .join(pattern.separator);
};

// Zenon's read_suffix: a count adjustment such as [n-1] after the end marker.
const readAdjustment = (text: string, position: number): [number, number] => {
  const match = /^\[n(?:\]|([+-])([0-9]*)\])/.exec(text.slice(position));
  if (match === null) return [0, position];
  const sign = match[1] === "-" ? -1 : 1;
  return [match[1] === undefined ? 0 : sign * Number(match[2]), position + match[0].length];
};

const trimNewlines = (text: string) => {
  if (text.length >= 2 && text.startsWith("\n") && text.endsWith("\n")) return text.slice(1, -1);
  if (text.length >= 4 && text.startsWith("\r\n") && text.endsWith("\r\n"))
    return text.slice(2, -2);
  throw new TlaZenonError("Zenon: a bad template");
};

// Zenon's Enum.expand_text.
const expandTemplate = (count: number, template: string) => {
  const parts: string[] = [];
  let position = 0;
  for (;;) {
    const up = template.indexOf("@@@", position);
    const down = template.indexOf("...", position);
    if (up === -1 && down === -1) break;
    const isReversed = up === -1 || (down !== -1 && down < up);
    const start = isReversed ? down : up;
    const end = template.indexOf(isReversed ? "@@@" : "...", start + 3);
    if (end === -1) throw new TlaZenonError("Zenon: a bad template");
    parts.push(template.slice(position, start));
    const text = template.slice(start + 3, end);
    const adjustment = readAdjustment(template, end + 3);
    const expanded =
      expandPattern(count + adjustment[0], text, isReversed) ??
      expandPattern(count + adjustment[0], trimNewlines(text), isReversed);
    if (expanded === undefined) throw new TlaZenonError("Zenon: a bad template");
    parts.push(expanded);
    position = adjustment[1];
  }
  parts.push(template.slice(position));
  return parts.join("");
};

export const printCaseLemma = (arity: number, isOther: boolean) =>
  `have zenon_case${isOther ? "other" : ""}${arity} :${expandTemplate(
    arity,
    isOther ? CASE_OTHER_TEMPLATE : CASE_TEMPLATE,
  )}`;

export const printRecordLemma = (arity: number) =>
  `have zenon_inrecordsetI${arity} :${expandTemplate(arity, getRecordTemplate(arity))}`;

const CASE_TEMPLATE = String.raw`
  "!! P @@@c1x e1x c2x e2x... .
    P (CASE @@@c1x -> e1x [] c2x -> e2x...) ==>
@@@
    (c1x ==> P (e1x) ==> FALSE) ==>
    (c2x ==> P (e2x) ==> FALSE) ==>
...
    (...~c2x & ~c1x@@@ & TRUE ==> FALSE) ==>
    FALSE"
proof -
  fix P @@@c1x e1x c2x e2x...
  assume h: "P (CASE @@@c1x -> e1x [] c2x -> e2x...)"
            (is "P (?cas)")
@@@
  assume h1: "c1x ==> P (e1x) ==> FALSE"
  assume h2: "c2x ==> P (e2x) ==> FALSE"
...
  assume hoth: "...~c2x & ~c1x@@@ & TRUE ==> FALSE"
  def cs == "<<@@@c1x, c2x...>>" (is "?cs")
  def es == "<<@@@e1x, e2x...>>" (is "?es")
  def arms == "UNION {CaseArm (?cs[i], ?es[i]) : i \\in DOMAIN ?cs}"
              (is "?arms")
  def cas == "?cas"
  have h0: "P (cas)" using h by (fold cas_def)
  def dcs == "...c2x | c1x@@@" (is "?dcs")
  show FALSE
  proof (rule zenon_em [of "?dcs"])
    assume ha: "~(?dcs)"
@@@
    have hh1: "~c1x" using ha by blast
    have hh2: "~c2x" using ha by blast
...
    show FALSE
      using hoth @@@hh1 hh2... by blast
  next
    assume ha: "?dcs"
    def scs == "zenon_seqify (@@@zenon_appseq (zenon_appseq (...
                               <<>>, @@@c1x), c2x)...)"
               (is "?scs")
    def ses == "zenon_seqify (@@@zenon_appseq (zenon_appseq (...
                               <<>>, @@@e1x), e2x)...)"
               (is "?ses")
    have ha1: "\<exists> i \<in> DOMAIN ?scs : ?scs[i]"
      using ha zenon_case_seq_empty
      by (simp only: zenon_case_seq_simpl zenon_seqify_empty, blast)
    have ha2: "\<exists> i \<in> DOMAIN ?cs : ?cs[i]"
      using ha1 by (simp only: zenon_seqify_appseq zenon_seqify_empty)
    have hb: "\\E x : x \\in arms"
      using zenon_case_domain [OF ha2, where es = "?es"]
      by (unfold arms_def, blast)
    have hc: "(CHOOSE x : x \\in arms) \\in arms"
      using hb by (unfold Ex_def, auto)
    have hf0: "?cas \\in arms"
      using hc by (unfold arms_def, fold Case_def)
    have hf3: "cas \\in UNION {CaseArm (?scs[i], ?ses[i])
                                  : i \\in DOMAIN ?scs}"
              (is "?hf3")
      using hf0 by (fold cas_def, unfold arms_def,
                    simp only: zenon_seqify_appseq zenon_seqify_empty)
    have hf4: "Len (?scs) = Len (?ses)" (is "?hf4")
      by (simp only: zenon_case_len_simpl)
    have hf5: "?hf4 & ?hf3"
      by (rule conjI [OF hf4 hf3])
    have hf: "
               ...cas \\in CaseArm (c2x, e2x)
             | cas \\in CaseArm (c1x, e1x)@@@
             | cas \\in UNION {CaseArm (zenon_seqify (<<>>)[i],
                                          zenon_seqify (<<>>)[i])
                                 : i \\in DOMAIN zenon_seqify (<<>>)}
             " (is "_ | ?gxx")
      using hf5 by (simp only: zenon_case_union_simpl, blast)
@@@
    have hg1x: "cas \\in CaseArm (c1x, e1x) => FALSE"
      using h0 h1 by auto
    have hg2x: "cas \\in CaseArm (c2x, e2x) => FALSE"
      using h0 h2 by auto
...
    from hf
    have hh0: "?gxx" ...(is "_ | ?g1")
      by (rule zenon_disjE1 [OF _ hg3x])
    then have hh1: "?g1" (is "_ | ?g0")
      by (rule zenon_disjE1 [OF _ hg2x])
    then have hh0: "?g0"@@@[n-1]
      by (rule zenon_disjE1 [OF _ hg1x])
    have hi: "cas \\in UNION {CaseArm (<<>>[i], <<>>[i])
                                 : i \\in DOMAIN <<>>}"
      using hh0 by (simp only: zenon_seqify_empty)
    show FALSE
      by (rule zenon_case_empty_union [OF hi])
  qed
qed
`;

const CASE_OTHER_TEMPLATE = String.raw`
  "!! P oth @@@c1x e1x c2x e2x... .
    P (CASE @@@c1x -> e1x [] c2x -> e2x... [] OTHER -> oth) ==>
@@@
    (c1x ==> P (e1x) ==> FALSE) ==>
    (c2x ==> P (e2x) ==> FALSE) ==>
...
    (...~c2x & ~c1x@@@ & TRUE ==> P (oth) ==> FALSE) ==>
    FALSE"
proof -
  fix P oth @@@c1x e1x c2x e2x...
  assume h: "P (CASE @@@c1x -> e1x [] c2x -> e2x... [] OTHER -> oth)"
            (is "P (?cas)")
@@@
  assume h1: "c1x ==> P (e1x) ==> FALSE"
  assume h2: "c2x ==> P (e2x) ==> FALSE"
...
  assume hoth: "...~c2x & ~c1x@@@ & TRUE ==> P (oth) ==> FALSE"
  def cs == "<<@@@c1x, c2x...>>" (is "?cs")
  def es == "<<@@@e1x, e2x...>>" (is "?es")
  def arms == "UNION {CaseArm (?cs[i], ?es[i]) : i \\in DOMAIN ?cs}"
              (is "?arms")
  def cas == "?cas"
  have h0: "P (cas)" using h by (fold cas_def)
  def dcs == "...c2x | c1x@@@ | FALSE" (is "?dcs")
  def scs == "zenon_seqify (@@@zenon_appseq (zenon_appseq (...
                             <<>>, @@@c1x), c2x)...)"
             (is "?scs")
  have hscs : "?cs = ?scs"
    by (simp only: zenon_seqify_appseq zenon_seqify_empty)
  def ses == "zenon_seqify (@@@zenon_appseq (zenon_appseq (...
                             <<>>, @@@e1x), e2x)...)"
             (is "?ses")
  have hses : "?es = ?ses"
    by (simp only: zenon_seqify_appseq zenon_seqify_empty)
  have hlen: "Len (?scs) = Len (?ses)" (is "?hlen")
    by (simp only: zenon_case_len_simpl)
  def armoth == "CaseArm (\<forall> i \<in> DOMAIN ?cs : ~?cs[i], oth)"
                (is "?armoth")
  show FALSE
  proof (rule zenon_em [of "?dcs"])
    assume ha: "~(?dcs)"
    have hb: "P (CHOOSE x : x \\in arms \<union> armoth)"
      using h by (unfold CaseOther_def, fold arms_def armoth_def)
    have hc: "arms \\cup armoth
              = UNION {CaseArm (?scs[i], ?ses[i]) : i \\in DOMAIN ?scs}
                \\cup CaseArm (\<forall> i \<in> DOMAIN ?scs : ~?scs[i],
                                 oth)"
             (is "_ = ?sarmsoth")
      using hscs hses by (unfold arms_def armoth_def, auto)
    have hd: "~(?dcs) & ?hlen & arms \<union> armoth = ?sarmsoth"
      using ha hlen hc by blast
    have he: "arms \<union> armoth = {oth}"
      using hd by (simp only: zenon_case_oth_simpl zenon_case_oth_empty)
    have hf: "(CHOOSE x : x \\in arms \\cup armoth) = oth"
      using he by auto
    have hg: "P (oth)"
      using hb hf by auto
@@@
    have hh1: "~c1x" using ha by blast
    have hh2: "~c2x" using ha by blast
...
    show FALSE
      using hg hoth @@@hh1 hh2... by blast
  next
    assume ha: "?dcs"
    have ha1: "\<exists> i \<in> DOMAIN ?scs : ?scs[i]"
      using ha zenon_case_seq_empty
      by (simp only: zenon_case_seq_simpl zenon_seqify_empty, blast)
    have ha2: "\<exists> i \<in> DOMAIN ?cs : ?cs[i]"
      using ha1 hscs by auto
    have ha3: "~ (\<forall> i \<in> DOMAIN ?cs : ~?cs[i])"
      using ha2 by blast
    have ha4: "armoth = {}"
      using ha3 condElse [OF ha3, where t = "{oth}" and e = "{}"]
      by (unfold armoth_def CaseArm_def, blast)
    have hb: "\\E x : x \\in arms \\cup armoth"
      using zenon_case_domain [OF ha2, where es = "?es"]
      by (unfold arms_def, blast)
    have hc: "(CHOOSE x : x \\in arms \\cup armoth)
               \\in arms \\cup armoth"
      using hb by (unfold Ex_def, auto)
    have hf0: "?cas \\in arms \\cup armoth"
      using hc by (unfold arms_def armoth_def, fold CaseOther_def)
    have hf1: "cas \\in arms \\cup armoth"
      using hf0 by (fold cas_def)
    have hf2: "cas \\in arms"
      using hf1 ha4 by auto
    have hf3: "cas \\in UNION {CaseArm (?scs[i], ?ses[i])
                                  : i \\in DOMAIN ?scs}"
              (is "?hf3")
      using hf2 by (unfold arms_def,
                    simp only: zenon_seqify_appseq zenon_seqify_empty)
    have hf5: "?hlen & ?hf3"
      by (rule conjI [OF hlen hf3])
    have hf: "
               ...cas \\in CaseArm (c2x, e2x)
             | cas \\in CaseArm (c1x, e1x)@@@
             | cas \\in UNION {CaseArm (zenon_seqify (<<>>)[i],
                                          zenon_seqify (<<>>)[i])
                                 : i \\in DOMAIN zenon_seqify (<<>>)}
             " (is "_ | ?gxx")
      using hf5 by (simp only: zenon_case_union_simpl, blast)
@@@
    have hg1x: "cas \\in CaseArm (c1x, e1x) => FALSE"
      using h0 h1 by auto
    have hg2x: "cas \\in CaseArm (c2x, e2x) => FALSE"
      using h0 h2 by auto
...
    from hf
    have hh0: "?gxx" ...(is "_ | ?g1")
      by (rule zenon_disjE1 [OF _ hg3x])
    then have hh1: "?g1" (is "_ | ?g0")
      by (rule zenon_disjE1 [OF _ hg2x])
    then have hh0: "?g0"@@@[n-1]
      by (rule zenon_disjE1 [OF _ hg1x])
    have hi: "cas \\in UNION {CaseArm (<<>>[i], <<>>[i])
                                 : i \\in DOMAIN <<>>}"
      using hh0 by (simp only: zenon_seqify_empty)
    show FALSE
      by (rule zenon_case_empty_union [OF hi])
  qed
qed
`;

const getRecordTemplate = (arity: number) => String.raw`
  "!! r @@@l1x s1x l2x s2x... .
    isAFcn (r) ==>
    DOMAIN r = {@@@l1x, l2x...} ==>
@@@
    r[l1x] \\in s1x ==>
    r[l2x] \\in s2x ==>
...
    r \\in [@@@l1x : s1x, l2x : s2x...]"
proof -
  fix r @@@l1x s1x l2x s2x...
  assume hfcn: "isAFcn (r)"
  assume hdom: "DOMAIN r = {@@@l1x, l2x...}"
@@@
  assume h1: "r[l1x] \\in s1x"
  assume h2: "r[l2x] \\in s2x"
...
  let ?doms = "<<@@@l1x, l2x...>>"
  let ?domset = "{@@@l1x, l2x...}"
  let ?domsetrev = "{...l2x, l1x@@@}"
  let ?rngs = "<<@@@s1x, s2x...>>"
  let ?n0n = "0"
@@@
  let ?n1n = "Succ[?n0n]"
  let ?n2n = "Succ[?n1n]"
...
  let ?indices = "{...?n2n, ?n1n@@@}"
  have hdomx : "?domsetrev = DOMAIN r"
  by (rule zenon_set_rev_1, (rule zenon_set_rev_2)+, rule zenon_set_rev_3,
      rule hdom)
  show "r \\in EnumFuncSet (?doms, ?rngs)"
  proof (rule EnumFuncSetI [of r, OF hfcn])
    have hx1: "isASeq (?doms) & ?domsetrev = Range (?doms)"
    by ((rule zenon_range_2)+, rule zenon_range_1)
    have hx2: "?domsetrev = Range (?doms)"
    by (rule conjD2 [OF hx1])
    show "DOMAIN r = Range (?doms)"
    by (rule subst [where P = "%x. x = Range (?doms)", OF hdomx hx2])
  next
    show "DOMAIN ?rngs = DOMAIN ?doms"
    by (rule zenon_tuple_dom_3, (rule zenon_tuple_dom_2)+,
        rule zenon_tuple_dom_1)
  next
    have hdomseq: "isASeq (?doms)" by auto
    have hindx: "isASeq (?doms) & ?n${arity}n = Len (?doms)
                  & ?indices = DOMAIN ?doms"
    by (simp only: DomainSeqLen [OF hdomseq], (rule zenon_dom_app_2)+,
        rule zenon_dom_app_1)
    have hind: "?indices = DOMAIN ?doms" by (rule conjE [OF hindx], elim conjE)
    show "ALL i in DOMAIN ?doms : r[?doms[i]] \\in ?rngs[i]"
    proof (rule subst [OF hind], (rule zenon_all_rec_2)+, rule zenon_all_rec_1)
@@@
      have hn: "l1x = ?doms[?n1n]"
      by (((rule zenon_tuple_acc_2, safe, simp only: zenon_ss_1 zenon_ss_2,
            rule zenon_zero_lt,
            simp only: zenon_ss_1 zenon_ss_2 zenon_sa_1 zenon_sa_2,
            ((rule zenon_ss_le_sa_2)+)?, rule zenon_ss_le_sa_1
           )+)?,
          rule zenon_tuple_acc_1, auto)
      have hs: "s1x = ?rngs[?n1n]"
      by (((rule zenon_tuple_acc_2, safe, simp only: zenon_ss_1 zenon_ss_2,
            rule zenon_zero_lt,
            simp only: zenon_ss_1 zenon_ss_2 zenon_sa_1 zenon_sa_2,
            ((rule zenon_ss_le_sa_2)+)?, rule zenon_ss_le_sa_1
           )+)?,
          rule zenon_tuple_acc_1, auto)
      show "r[?doms[?n1n]] \\in ?rngs[?n1n]"
      by (rule subst[OF hs], rule subst[OF hn], rule h1)
    next
      have hn: "l2x = ?doms[?n2n]"
      by (((rule zenon_tuple_acc_2, safe, simp only: zenon_ss_1 zenon_ss_2,
            rule zenon_zero_lt,
            simp only: zenon_ss_1 zenon_ss_2 zenon_sa_1 zenon_sa_2,
            ((rule zenon_ss_le_sa_2)+)?, rule zenon_ss_le_sa_1
           )+)?,
          rule zenon_tuple_acc_1, auto)
      have hs: "s2x = ?rngs[?n2n]"
      by (((rule zenon_tuple_acc_2, safe, simp only: zenon_ss_1 zenon_ss_2,
            rule zenon_zero_lt,
            simp only: zenon_ss_1 zenon_ss_2 zenon_sa_1 zenon_sa_2,
            ((rule zenon_ss_le_sa_2)+)?, rule zenon_ss_le_sa_1
           )+)?,
          rule zenon_tuple_acc_1, auto)
      show "r[?doms[?n2n]] \\in ?rngs[?n2n]"
      by (rule subst[OF hs], rule subst[OF hn], rule h2)
...
    qed
  qed
qed
`;
