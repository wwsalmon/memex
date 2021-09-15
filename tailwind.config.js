module.exports = {
    mode: 'jit',
    purge: [
        './**/*.html',
        './**/*.tsx',
        './**/*.ts',
    ],
    theme: {
        container: {
            center: true,
            padding: "1rem",
        },
    },
    variants: {},
    plugins: [
        require("@tailwindcss/typography"),
    ],
}
