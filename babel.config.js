const transformImportMetaEnv = ({ types: t }) => ({
  visitor: {
    MemberExpression(path) {
      const { node } = path;
      const env = node.object;
      const isImportMeta =
        t.isMetaProperty(env) &&
        t.isIdentifier(env.meta, { name: 'import' }) &&
        t.isIdentifier(env.property, { name: 'meta' });

      if (isImportMeta && !node.computed && t.isIdentifier(node.property, { name: 'env' })) {
        path.replaceWith(
          t.memberExpression(t.identifier('process'), t.identifier('env')),
        );
        return;
      }

      if (
        node.computed ||
        !t.isIdentifier(node.property, { name: 'MODE' }) ||
        !t.isMemberExpression(env) ||
        env.computed ||
        !t.isIdentifier(env.property, { name: 'env' }) ||
        !t.isMetaProperty(env.object) ||
        !t.isIdentifier(env.object.meta, { name: 'import' }) ||
        !t.isIdentifier(env.object.property, { name: 'meta' })
      ) {
        return;
      }

      path.replaceWith(
        t.memberExpression(
          t.memberExpression(t.identifier('process'), t.identifier('env')),
          t.identifier('NODE_ENV'),
        ),
      );
    },
  },
});

module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'], plugins: [transformImportMetaEnv] };
};
